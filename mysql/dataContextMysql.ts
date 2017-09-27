import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IMySql, IPool, IPoolConfig, IConnection } from 'mysql';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");

var mysqlPool: IPool;
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
    constructor(option: IPoolConfig) {
        if (!mysqlPool) mysqlPool = mysql.createPool(option);
        this.interpreter = new Interpreter(mysql.escape);
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
    Delete<T extends IEntityObject>(entity: T, func: (x: T) => boolean);
    Delete(entity: any, func?: any, paramsKey?: string[], paramsValue?: any[]) {
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