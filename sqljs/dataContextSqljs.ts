import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IQueryParameter, IQuerySelector } from '../queryObject';
import { Define } from '../define/dataDefine';
import { Interpreter } from '../interpreter';
import * as sqlstring from 'sqlstring-sqlite';
import * as path from 'path';

import * as initSqlJs from 'sql.js';
import * as fs from 'fs';
// import * as initSqlJs from '../node_modules/sql.js/dist/sql-wasm.js';

function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger: (...args) => void = log;

export class SqlJSDataContext implements IDataContext {
    get ObjectName() {
        return 'SqlJSDataContext';
    }
    private db: any;
    private option;
    private querySentence: any[] = [];
    private transactionOn: string;
    private interpreter: Interpreter;
    private transStatus: any = [];
    private dbPath: string;
    constructor(option) {
        this.option = option;
        this.interpreter = new Interpreter(sqlstring.escape);
        let USER_DIR = process.env.USER_DIR;
        USER_DIR || (USER_DIR = "");
        //this.db = new sqlite3.Database(path.resolve(`${USER_DIR}${option.database}`));
        this.dbPath = path.resolve(`${USER_DIR}${option.database}`);
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
            this.exportToDb();
        }
        return (<any>entity).ConverToEntity(entity);
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
            this.exportToDb();
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
            let r = await this.onSubmit(sqlStr);
            this.exportToDb();
            return r;
        }
    }
    BeginTranscation() {
        this.transactionOn = "on";
        this.transStatus.push({ key: new Date().getTime() });
    }
    async Commit() {
        if (this.transStatus.length > 1) {
            logger("transaction is pedding!");
            this.transStatus.splice(0, 1);
            return false;
        }
        await this.GetDB();
        try {
            let sqlall = `BEGIN;`;
            // await this.onSubmit('BEGIN;');
            for (let sql of this.querySentence) {
                // await this.onSubmit(sql);
                sqlall += sql;
            }
            sqlall += 'COMMIT;';
            await this.onSubmit(sqlall);
            // await this.onSubmit('COMMIT;');
            this.exportToDb();
        } catch (error) {
            console.log(error);
            await this.onSubmit('ROLLBACK;');
        }
        finally {
            this.CleanTransactionStatus();
        }
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
        this.GetDB();
    }
    async CreateTable(entity: IEntityObject) {
        let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
        let result = this.CreateTableSql(entity);
        sqls.push(result);

        for (let sql of sqls) {
            await this.onSubmit(sql);
        }

        return true;
    }

    private async GetDB() {
        if (!this.db) {
            let SQL = await initSqlJs();
            if (fs.existsSync(this.dbPath)) {
                let buf = fs.readFileSync(this.dbPath);
                this.db = new SQL.Database(buf);
            }
            else {
                this.db = new SQL.Database();
            }
        }

    }

    private exportToDb() {
        let data = this.db.export();
        let buffer = Buffer.from(data, 'binary');
        fs.writeFileSync(this.dbPath, buffer);
    }

    private async onSubmit(sql: string) {
        await this.GetDB();
        let res = this.db.exec(sql);
        return res;
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
                indexColumns.push(`CREATE INDEX idx_${item.ColumnName}_${entity.TableName()} ON ${entity.TableName()}(${item.ColumnName});`);
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