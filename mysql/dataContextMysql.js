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
const interpreter_1 = require("../interpreter");
const mysql = require("mysql");
const dataDefine_1 = require("../define/dataDefine");
const mysqlPoolManager_1 = require("./mysqlPoolManager");
function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger = log;
class MysqlDataContext {
    constructor(option) {
        this.querySentence = [];
        this.transStatus = [];
        let has = mysqlPoolManager_1.MysqlPoolManager.Current.HasPool(option.database);
        if (!has) {
            mysqlPoolManager_1.MysqlPoolManager.Current.CreatePool(option.database, mysql.createPool(option));
        }
        this.mysqlPool = mysqlPoolManager_1.MysqlPoolManager.Current.GetPool(option.database);
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
        this.option = option;
    }
    get ObjectName() {
        return 'MysqlDataContext';
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
    CreateBatch(entities, excludeFields) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield this.onSubmit(sqlStr);
            }
            return entities;
        });
    }
    Update(entity, excludeFields) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqlStr = this.interpreter.TransToUpdateSql(entity, excludeFields);
            if (this.transactionOn) {
                this.querySentence.push(sqlStr);
            }
            else {
                yield this.onSubmit(sqlStr);
            }
            return entity.ConverToEntity(entity);
        });
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
            this.mysqlPool.getConnection((err, conn) => __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    RollBack() {
        this.CleanTransactionStatus();
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
    CreateDatabase() {
        let conn = mysql.createConnection({
            host: this.option.host,
            user: this.option.user,
            password: this.option.password,
            database: "mysql"
        });
        let sql = "CREATE DATABASE IF NOT EXISTS `" + this.option.database + "` DEFAULT CHARACTER SET " + this.option.charset + " COLLATE utf8_unicode_ci;";
        return new Promise((resolve, reject) => {
            conn.connect(function (err) {
                if (err) {
                    return reject(err);
                }
                else {
                    conn.query(sql, function (err, result) {
                        if (err) {
                            return reject(err);
                        }
                        else {
                            resolve(result);
                            conn.end();
                        }
                    });
                }
            });
        });
    }
    CreateTable(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
            sqls.push(this.CreateTableSql(entity));
            for (let sql of sqls) {
                yield this.onSubmit(sql);
            }
            return true;
        });
    }
    CreateTableSql(entity) {
        let tableDefine = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];
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
                if (this.option.dbVersion) {
                    let dbVersionTmp = this.option.dbVersion.split('.');
                    if (parseInt(dbVersionTmp[0]) >= 8) {
                        dataType = 'JSON';
                    }
                }
            }
            const cs = `\`${item.ColumnName}\` ${dataType}${lengthStr} ${valueStr}`;
            if (item.IsPrimaryKey) {
                columnSqlList.push("PRIMARY KEY (`" + item.ColumnName + "`)");
            }
            let indexType = "USING BTREE";
            if (item.ForeignKey && item.ForeignKey.IsPhysics) {
                indexType = "";
                columnSqlList.push("CONSTRAINT `fk_" + item.ColumnName + "` FOREIGN KEY (`" + item.ColumnName + "`) REFERENCES `" + item.ForeignKey.ForeignTable + "` (`" + item.ForeignKey.ForeignColumn + "`)");
            }
            if (item.IsIndex) {
                columnSqlList.push("KEY `idx_" + item.ColumnName + "` (`" + item.ColumnName + "`) " + indexType);
            }
            columnSqlList.push(cs);
        }
        return `CREATE TABLE \`${entity.TableName()}\` ( ${columnSqlList.join(",")} )`;
    }
    DeleteTableSql(entity) {
        return "DROP TABLE IF EXISTS `" + entity.TableName() + "`;";
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
    TrasnQuery(conn, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                conn.query(sql, (err, result) => {
                    if (err) {
                        logger("TrasnQuery", err, sql);
                        conn.rollback(() => { reject(err); });
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        });
    }
    onSubmit(sqlStr) {
        return new Promise((resolve, reject) => {
            this.mysqlPool.getConnection((err, conn) => {
                logger(sqlStr);
                if (err) {
                    console.log("error sql:", sqlStr);
                    reject(err);
                }
                conn.query(sqlStr, (err, args) => {
                    conn.release();
                    if (err)
                        reject(err);
                    else
                        resolve(args);
                });
            });
        });
    }
    CleanTransactionStatus() {
        this.querySentence = [];
        this.transactionOn = null;
        this.transStatus = [];
    }
}
exports.MysqlDataContext = MysqlDataContext;
//# sourceMappingURL=dataContextMysql.js.map