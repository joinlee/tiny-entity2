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
let mysqlPool;
function log() {
    if (process.env.tinyLog == "on") {
        console.log(arguments);
    }
}
const logger = log;
class MysqlDataContext {
    constructor(option) {
        if (!mysqlPool)
            mysqlPool = mysql.createPool(option);
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
        this.option = option;
    }
    Create(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqlStr = this.interpreter.TransToInsertSql(obj);
            if (this.transactionOn) {
                this.querySentence.push(sqlStr);
            }
            else {
                yield this.onSubmit(sqlStr);
            }
            return obj;
        });
    }
    Update(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqlStr = this.interpreter.TransToUpdateSql(obj);
            if (this.transactionOn) {
                this.querySentence.push(sqlStr);
            }
            else {
                yield this.onSubmit(sqlStr);
            }
            return obj;
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
            mysqlPool.getConnection((err, conn) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    conn.release();
                    reject(err);
                }
                conn.beginTransaction(err => {
                    if (err) {
                        conn.release();
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
                                conn.release();
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
                    conn.release();
                    reject(error);
                }
            }));
        });
    }
    Query(...args) {
        if (args.length >= 1)
            return this.onSubmit(args[0]);
    }
    RollBack() {
        this.CleanTransactionStatus();
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
    CreateDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = "CREATE DATABASE IF NOT EXISTS `" + this.option.database + "` DEFAULT CHARACTER SET " + this.option.charset + " COLLATE utf8_unicode_ci;";
            yield this.onSubmit(sql);
            return true;
        });
    }
    CreateTable(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            let tableDefine = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
            let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
            let columnSqlList = [];
            for (let item of tableDefine) {
                let valueStr = item.NotAllowNULL ? "NOT NULL" : "DEFAULT NULL";
                let lengthStr = "";
                if (item.DataLength != undefined) {
                    let dcp = item.DecimalPoint != undefined ? "," + item.DecimalPoint : "";
                    lengthStr = "(" + item.DataLength + dcp + ")";
                }
                if (item.DefualtValue != undefined) {
                    if (item.DataType >= 0 && item.DataType <= 1) {
                        valueStr = "DEFAULT '" + item.DefualtValue + "'";
                    }
                    else {
                        valueStr = "DEFAULT " + item.DefualtValue;
                    }
                }
                let cs = "`" + item.ColumnName + "` " + dataDefine_1.Define.DataType[item.DataType] + lengthStr + " COLLATE " + this.option.collate + " " + valueStr;
                if (item.IsPrimaryKey) {
                    columnSqlList.push("PRIMARY KEY (`" + item.ColumnName + "`)");
                }
                let indexType = "USING BTREE";
                if (item.ForeignKey) {
                    indexType = "";
                    columnSqlList.push("CONSTRAINT `fk_" + item.ColumnName + "` FOREIGN KEY (`" + item.ColumnName + "`) REFERENCES `" + item.ForeignKey.ForeignTable + "` (`" + item.ForeignKey.ForeignColumn + "`)");
                }
                if (item.IsIndex) {
                    columnSqlList.push("KEY `idx_" + item.ColumnName + "` (`" + item.ColumnName + "`) " + indexType);
                }
                columnSqlList.push(cs);
            }
            sqls.push("CREATE TABLE `" + entity.TableName() + "` ( " + columnSqlList.join(",") + " ) ENGINE=InnoDB DEFAULT CHARSET=" + this.option.charset + " COLLATE=" + this.option.collate + ";");
            for (let sql of sqls) {
                yield this.onSubmit(sql);
            }
            return true;
        });
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
            mysqlPool.getConnection((err, conn) => {
                logger(sqlStr);
                if (err) {
                    conn.release();
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