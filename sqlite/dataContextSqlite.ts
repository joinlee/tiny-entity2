import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IQueryParameter, IQuerySelector } from '../queryObject';
import * as sqlite from 'sqlite3';
import { Define } from '../define/dataDefine';
import { Interpreter } from '../interpreter';
import * as sqlstring from 'sqlstring-sqlite';
import * as path from 'path';
let sqlite3 = sqlite.verbose();
function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger: (...args) => void = log;

export class SqliteDataContext implements IDataContext {
    get ObjectName() {
        return 'SqliteDataContext';
    }
    private db: sqlite.Database;
    private option;
    private querySentence: any[] = [];
    private transactionOn: string;
    private interpreter: Interpreter;
    private transStatus: any = [];
    constructor(option) {
        this.option = option;
        this.interpreter = new Interpreter(sqlstring.escape);
        let USER_DIR = process.env.USER_DIR;
        USER_DIR || (USER_DIR = "");
        this.db = new sqlite3.Database(path.resolve(`${USER_DIR}${option.database}`));
        this.db.serialize(() => {
            this.db.run('PRAGMA journal_mode = WAL;'); // 使用WAL模式，允许多个进程读写同一个数据库
            this.db.run('PRAGMA auto_vacuum = FULL;'); // 自动清理空闲空间，防止文件膨胀
            this.db.run('PRAGMA synchronous = FULL;');
        });

        this.db.on('error', (err) => {
            console.error('SqliteDataContext->', err);
            option.onError && option.onError(err);
        });
        // this.db = SqlitePool.Current.GetConnection(option);
    }
    Create<T extends IEntityObject>(entity: T): Promise<T>;
    Create<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    async Create(entity: any, excludeFields?: any) {
        let sqlStr = this.interpreter.TransToInsertSql(entity);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return (<any>entity).ConverToEntity(entity);
    }
    CreateBatch<T extends IEntityObject>(entities: T[]): Promise<T[]>;
    CreateBatch<T extends IEntityObject>(entities: T[], excludeFields: string[]): Promise<T[]>;
    async CreateBatch(entities: any, excludeFields?: any) {
        let sqlStr = "";
        let sqlValues: string[] = [];
        for (let entity of entities) {
            let sqlStrTmp = this.interpreter.TransToInsertSql(entity);
            let tps = sqlStrTmp.split("VALUES");

            sqlStr = tps[0];
            sqlValues.push(tps[1].replace(";", ""));
        }

        sqlStr = `${sqlStr}  VALUES ${sqlValues.join(',')};`;

        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return entities;
    }

    Update<T extends IEntityObject>(entity: T): Promise<T>;
    Update<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    async Update(entity: any, excludeFields?: any) {
        let sqlStr = this.interpreter.TransToUpdateSql(entity, excludeFields);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return (<any>entity).ConverToEntity(entity);
    }
    Delete(entity: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    async Delete(func: any, entity?: any, params?: any) {
        if (arguments.length > 1) {
            func = arguments[0];
            entity = arguments[1];
        }
        else {
            func = null;
            entity = arguments[0];
        }
        let sqlStr = this.interpreter.TransToDeleteSql(func, entity, params);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            return await this.onSubmit(sqlStr);
        }
    }
    BeginTranscation() {
        this.transactionOn = "on";
        this.transStatus.push({ key: new Date().getTime() });
    }
    Commit() {
        if (this.transStatus.length > 1) {
            logger("transaction is pedding!");
            this.transStatus.splice(0, 1);
            return false;
        }
        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                try {
                    await this.onSubmit('BEGIN;');
                    for (let sql of this.querySentence) {
                        await this.onSubmit(sql);
                    }
                    await this.onSubmit('COMMIT;');
                    resolve(null);
                } catch (error) {
                    await this.onSubmit('ROLLBACK;');
                    reject(error);
                }
                finally {
                    this.CleanTransactionStatus();
                }
            });
        })
    }
    async Query(...args: any[]): Promise<any> {
        if (args.length == 1) {
            return this.onSubmit(args[0]);
        }
        else if (args.length == 2) {
            let sqls = args[0];
            if (this.transactionOn == 'on') {
                for (let sql of sqls) {
                    this.querySentence.push(sql);
                }
            }
            else {
                return this.onSubmit(args[0]);
            }
        }
    }
    RollBack() {
        // throw new Error("Method not implemented.");
    }
    CreateDatabase() {
        // throw new Error("Method not implemented.");
    }
    CreateTable(entity: IEntityObject) {
        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
                let result = this.CreateTableSql(entity);
                sqls.push(result);

                for (let sql of sqls) {
                    await this.onSubmit(sql);
                }

                return resolve(true);
            });
        });
    }

    private onSubmit(sql: string) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, (err, row) => {
                logger(sql);
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }

    CreateTableSql(entity: IEntityObject) {
        let tableDefine = Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];
        let indexColumns = [];

        for (let item of tableDefine) {
            if (item.Mapping) continue;
            let valueStr = item.NotAllowNULL ? "NOT NULL" : "DEFAULT NULL";

            let lengthStr = "";
            if (item.DataLength != undefined) {
                let dcp = item.DecimalPoint != undefined ? "," + item.DecimalPoint : "";
                lengthStr = "(" + item.DataLength + dcp + ")";
            }

            if (item.DefaultValue != undefined) {
                if (item.DataType >= 0 && item.DataType <= 1) {
                    //string type
                    valueStr = "DEFAULT '" + item.DefaultValue + "'";
                }
                else {
                    //number type
                    valueStr = "DEFAULT " + item.DefaultValue;
                }
            }

            let dataType = Define.DataType[item.DataType];
            if (item.DataType == Define.DataType.Array) {
                dataType = 'VARCHAR';
            }
            else if (item.DataType == Define.DataType.JSON) {
                dataType = 'TEXT';
            }

            let primaryKey = '';
            if (item.IsPrimaryKey) {
                primaryKey = 'PRIMARY KEY';
            }

            let cs = `\`${item.ColumnName}\` ${dataType}${lengthStr} ${primaryKey} ${valueStr}`;

            if (item.ForeignKey && item.ForeignKey.IsPhysics) {
                let f = `FOREIGN KEY(\`${item.ColumnName}\`) REFERENCES ${item.ForeignKey.ForeignTable}(${item.ForeignKey.ForeignColumn})`;
                columnSqlList.push(f);
            }
            if (item.IsIndex) {
                indexColumns.push(`CREATE INDEX idx_${item.ColumnName} ON ${entity.TableName()}(${item.ColumnName});`);
            }

            columnSqlList.push(cs);
        }

        let sql = `CREATE TABLE \`${entity.TableName()}\`( ${columnSqlList.join(', ')} ); `;
        sql += ` ${indexColumns.join(' ')}`;
        return sql;
    }
    DeleteTableSql(entity: IEntityObject) {
        return "DROP TABLE IF EXISTS `" + entity.TableName() + "`;";
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
    private CreateOperateLog(entity: IEntityObject) {
        let tableDefine = Define.DataDefine.Current.GetMetedata(entity);
        let opLog = {
            tableName: entity.TableName(),
            column: tableDefine,
            version: Date.now()
        };
        return opLog;
    }

    GetEntityInstance(entityName: string) {
        let r = new this[entityName].constructor();
        delete r.ctx;
        delete r.interpreter;
        // delete r.ConverToEntity;
        delete r.joinEntities;
        return r;
    }

    private CleanTransactionStatus() {
        this.querySentence = [];
        this.transactionOn = null;
        this.transStatus = [];
    }
}

class SqlitePool {
    static Current: SqlitePool = new SqlitePool();
    private db: sqlite.Database;
    GetConnection(option): sqlite.Database {
        if (!this.db) {
            this.db = new sqlite3.Database(option.database);
        }

        return this.db;
    }
}