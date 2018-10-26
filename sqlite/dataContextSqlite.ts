import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IQueryParameter, IQuerySelector } from '../queryObject';
import * as sqlite from 'sqlite3';
import * as mysql from "mysql";
import { Define } from '../define/dataDefine';
import { Interpreter } from '../interpreter';
let sqlite3 = sqlite.verbose();
function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger: (...args) => void = log;

export class SqliteDataContext implements IDataContext {
    private db: sqlite.Database;
    private option;
    private querySentence: any[] = [];
    private transactionOn: string;
    private interpreter: Interpreter;
    private transStatus: any = [];
    constructor(option) {
        this.option = option;
        this.interpreter = new Interpreter(mysql.escape);
        this.db = new sqlite3.Database(option.database);
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
    Update<T extends IEntityObject>(entity: T): Promise<T>;
    Update<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    Update(entity: any, excludeFields?: any) {
        return null;
    }
    Delete(entity: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    Delete(func: any, entity?: any, params?: any) {
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
            return this.onSubmit(sqlStr);
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
            mysqlPool.getConnection(async (err, conn) => {
                if (err) {
                    conn.destroy();
                    reject(err);
                }
                conn.beginTransaction(err => {
                    if (err) {
                        conn.destroy();
                        reject(err);
                    }
                });
                try {
                    for (let sql of this.querySentence) {
                        logger(sql);
                        await this.TrasnQuery(conn, sql);
                    }
                    conn.commit(err => {
                        if (err) conn.rollback(() => {
                            conn.destroy();
                            reject(err);
                        });
                        this.CleanTransactionStatus();
                        conn.release();
                        resolve(true);
                        logger("Transcation successful!");
                    });
                } catch (error) {
                    this.CleanTransactionStatus();
                    conn.destroy();
                    reject(error);
                }
            });
        });
    }
    async Query(...args: any[]): Promise<any> {
        if (args.length == 1)
            return this.onSubmit(args[0]);
        else if (args.length == 2) {
            let sql = args[0];
            try {
                this.BeginTranscation();
                this.querySentence.push(sql);
                await this.Commit();
            }
            catch (error) {
                await this.RollBack();
                throw error;
            }
        }
    }
    RollBack() {
        throw new Error("Method not implemented.");
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
            })
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

            let cs = `${item.ColumnName} ${dataType}${lengthStr} ${primaryKey} ${valueStr}`;

            if (item.ForeignKey && item.ForeignKey.IsPhysics) {
                let f = `FOREIGN KEY(${item.ColumnName}) REFERENCES ${item.ForeignKey.ForeignTable}(${item.ForeignKey.ForeignColumn})`;
                columnSqlList.push(f);
            }
            if (item.IsIndex) {
                indexColumns.push(`CREATE INDEX idx_${item.ColumnName} ON ${entity.TableName()}(${item.ColumnName});`);
            }

            columnSqlList.push(cs);
        }

        let sql = `
        CREATE TABLE ${entity.TableName()}(
            ${columnSqlList.join(',\n')}
        );

        ${indexColumns.join('\n')}
        `;

        return sql;
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
}