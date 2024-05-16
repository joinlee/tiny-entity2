"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteDataContext = void 0;
const sqlite = require("sqlite3");
const dataDefine_1 = require("../define/dataDefine");
const interpreter_1 = require("../interpreter");
const sqlstring = require("sqlstring-sqlite");
const path = require("path");
let sqlite3 = sqlite.verbose();
function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger = log;
class SqliteDataContext {
    constructor(option) {
        this.querySentence = [];
        this.transStatus = [];
        this.option = option;
        this.interpreter = new interpreter_1.Interpreter(sqlstring.escape);
        let USER_DIR = process.env.USER_DIR;
        USER_DIR || (USER_DIR = "");
        this.db = new sqlite3.Database(path.resolve(`${USER_DIR}${option.database}`));
        this.db.serialize(() => {
            this.db.run('PRAGMA journal_mode = WAL;');
            this.db.run('PRAGMA auto_vacuum = FULL;');
            this.db.run('PRAGMA synchronous = FULL;');
        });
        this.db.on('error', (err) => {
            console.error('SqliteDataContext->', err);
            option.onError && option.onError(err);
        });
    }
    get ObjectName() {
        return 'SqliteDataContext';
    }
    async Create(entity, excludeFields) {
        let sqlStr = this.interpreter.TransToInsertSql(entity);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return entity.ConverToEntity(entity);
    }
    async CreateBatch(entities, excludeFields) {
        let sqlStr = "";
        let sqlValues = [];
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
    async Update(entity, excludeFields) {
        let sqlStr = this.interpreter.TransToUpdateSql(entity, excludeFields);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return entity.ConverToEntity(entity);
    }
    async Delete(func, entity, params) {
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
                }
                catch (error) {
                    await this.onSubmit('ROLLBACK;');
                    reject(error);
                }
                finally {
                    this.CleanTransactionStatus();
                }
            });
        });
    }
    async Query(...args) {
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
    }
    CreateDatabase() {
    }
    CreateTable(entity) {
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
    onSubmit(sql) {
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
    CreateTableSql(entity) {
        let tableDefine = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];
        let indexColumns = [];
        for (let item of tableDefine) {
            if (item.Mapping)
                continue;
            let valueStr = item.NotAllowNULL ? "NOT NULL" : "DEFAULT NULL";
            let lengthStr = "";
            if (item.DataLength != undefined) {
                let dcp = item.DecimalPoint != undefined ? "," + item.DecimalPoint : "";
                lengthStr = "(" + item.DataLength + dcp + ")";
            }
            if (item.DefaultValue != undefined) {
                if (item.DataType >= 0 && item.DataType <= 1) {
                    valueStr = "DEFAULT '" + item.DefaultValue + "'";
                }
                else {
                    valueStr = "DEFAULT " + item.DefaultValue;
                }
            }
            let dataType = dataDefine_1.Define.DataType[item.DataType];
            if (item.DataType == dataDefine_1.Define.DataType.Array) {
                dataType = 'VARCHAR';
            }
            else if (item.DataType == dataDefine_1.Define.DataType.JSON) {
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
    DeleteTableSql(entity) {
        return "DROP TABLE IF EXISTS `" + entity.TableName() + "`;";
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
    CreateOperateLog(entity) {
        let tableDefine = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
        let opLog = {
            tableName: entity.TableName(),
            column: tableDefine,
            version: Date.now()
        };
        return opLog;
    }
    GetEntityInstance(entityName) {
        let r = new this[entityName].constructor();
        delete r.ctx;
        delete r.interpreter;
        delete r.joinEntities;
        return r;
    }
    CleanTransactionStatus() {
        this.querySentence = [];
        this.transactionOn = null;
        this.transStatus = [];
    }
}
exports.SqliteDataContext = SqliteDataContext;
class SqlitePool {
    GetConnection(option) {
        if (!this.db) {
            this.db = new sqlite3.Database(option.database);
        }
        return this.db;
    }
}
SqlitePool.Current = new SqlitePool();
