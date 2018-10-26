"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite = require("sqlite3");
const mysql = require("mysql");
const dataDefine_1 = require("../define/dataDefine");
const interpreter_1 = require("../interpreter");
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
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
        this.db = new sqlite3.Database(option.database);
    }
    Create(entity, excludeFields) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqlStr = this.interpreter.TransToInsertSql(entity);
            if (this.transactionOn) {
                this.querySentence.push(sqlStr);
            }
            else {
                yield this.onSubmit(sqlStr);
            }
            return entity.ConverToEntity(entity);
        });
    }
    Update(entity, excludeFields) {
        return null;
    }
    Delete(func, entity, params) {
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
            mysqlPool.getConnection((err, conn) => __awaiter(this, void 0, void 0, function* () {
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
                        yield this.TrasnQuery(conn, sql);
                    }
                    conn.commit(err => {
                        if (err)
                            conn.rollback(() => {
                                conn.destroy();
                                reject(err);
                            });
                        this.CleanTransactionStatus();
                        conn.release();
                        resolve(true);
                        logger("Transcation successful!");
                    });
                }
                catch (error) {
                    this.CleanTransactionStatus();
                    conn.destroy();
                    reject(error);
                }
            }));
        });
    }
    Query(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.length == 1)
                return this.onSubmit(args[0]);
            else if (args.length == 2) {
                let sql = args[0];
                try {
                    this.BeginTranscation();
                    this.querySentence.push(sql);
                    yield this.Commit();
                }
                catch (error) {
                    yield this.RollBack();
                    throw error;
                }
            }
        });
    }
    RollBack() {
        throw new Error("Method not implemented.");
    }
    CreateDatabase() {
    }
    CreateTable(entity) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => __awaiter(this, void 0, void 0, function* () {
                let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
                let result = this.CreateTableSql(entity);
                sqls.push(result);
                for (let sql of sqls) {
                    yield this.onSubmit(sql);
                }
                return resolve(true);
            }));
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
}
exports.SqliteDataContext = SqliteDataContext;
//# sourceMappingURL=dataContextSqlite.js.map