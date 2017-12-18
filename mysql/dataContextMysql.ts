import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IMySql, IPool, IPoolConfig, IConnection } from 'mysql';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");
import { Define } from '../define/dataDefine';

let mysqlPool: IPool;
function log() {
    if (process.env.tinyLog == "on") {
        console.log(arguments);
    }
}
const logger: (...args) => void = log;

export class MysqlDataContext implements IDataContext {
    private querySentence: any[];
    private transStatus: any;
    private transactionOn: string;
    private interpreter: Interpreter;
    private option: IPoolConfig;
    constructor(option: IPoolConfig) {
        if (!mysqlPool) mysqlPool = mysql.createPool(option);
        this.interpreter = new Interpreter(mysql.escape);
        this.option = option;
    }

    async Create(obj: any) {
        let sqlStr = this.interpreter.TransToInsertSql(obj);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return obj;
    }

    async Update(obj: IEntityObject) {
        let sqlStr = this.interpreter.TransToUpdateSql(obj);
        if (this.transactionOn) {
            this.querySentence.push(sqlStr);
        }
        else {
            await this.onSubmit(sqlStr);
        }
        return obj;
    }

    Delete(obj: IEntityObject);
    Delete<T extends IEntityObject>(func: (x: T) => boolean, entity: T, paramsKey?: string[], paramsValue?: any[]);
    Delete(func: any, entity?: any, paramsKey?: any, paramsValue?: any) {
        let sqlStr = this.interpreter.TransToDeleteSql(entity, func, paramsKey, paramsValue);
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
                        await this.TrasnQuery(conn, sql);
                    }
                    conn.commit(err => {
                        if (err) conn.rollback(() => {
                            conn.release();
                            reject(err);
                        });
                        this.CleanTransactionStatus();
                        conn.release();
                        resolve(true);
                        logger("Transcation successful!");
                    });
                } catch (error) {
                    this.CleanTransactionStatus();
                    conn.release();
                    reject(error);
                }
            });
        });
    }
    Query(...args: any[]) {
        if (args.length >= 1)
            return this.onSubmit(args[0]);
    }
    RollBack() {
        this.CleanTransactionStatus();
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
    async CreateDatabase() {
        let sql = "CREATE DATABASE IF NOT EXISTS `" + this.option.database + "` DEFAULT CHARACTER SET " + this.option.charset + " COLLATE utf8_unicode_ci;";
        let r = await this.onSubmit(sql);
        return r;
    }

    async CreateTable(entity: IEntityObject) {
        let tableDefine = Define.DataDefine.Current.GetMetedata(entity);
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
                    //string type
                    valueStr = "DEFAULT '" + item.DefualtValue + "'";
                }
                else {
                    //number type
                    valueStr = "DEFAULT " + item.DefualtValue;
                }
            }

            let cs = "`" + item.ColumnName + "` " + Define.DataType[item.DataType] + lengthStr + " COLLATE " + (<any>this.option).collate + " " + valueStr;
            if (item.IsPrimaryKey) {
                columnSqlList.push("PRIMARY KEY (`" + item.ColumnName + "`)");
            }

            columnSqlList.push(cs);
        }

        sqls.push("CREATE TABLE `" + entity.TableName() + "` (" + columnSqlList.join(",") + ") ENGINE=InnoDB DEFAULT CHARSET=" + this.option.charset + " COLLATE=" + (<any>this.option).collate + ";");

        let r = await this.onSubmit(sqls.join(" "));
        return r;
    }

    private async TrasnQuery(conn: IConnection, sql: string) {
        return new Promise((resolve, reject) => {
            conn.query(sql, (err, result) => {
                if (err) {
                    logger("TrasnQuery", err, sql);
                    conn.rollback(() => { reject(err) });
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    private onSubmit(sqlStr: string) {
        return new Promise((resolve, reject) => {
            mysqlPool.getConnection((err, conn) => {
                logger(sqlStr);
                if (err) {
                    conn.release();
                    reject(err);
                }
                conn.query(sqlStr, (err, args) => {
                    conn.release();
                    if (err) reject(err);
                    else resolve(args);
                });
            });
        });
    }
    private CleanTransactionStatus() {
        this.querySentence = [];
        this.transactionOn = null;
        this.transStatus = [];
    }

}