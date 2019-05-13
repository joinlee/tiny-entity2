import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IMySql, IPool, IPoolConfig, IConnection } from 'mysql';
import { Interpreter } from '../interpreter';
import * as mysql from "mysql";
import { Define } from '../define/dataDefine';
import { IQueryParameter, IQuerySelector } from '../queryObject';

let mysqlPool: IPool;
function log() {
    if (process.env.tinyLog == "on") {
        console.log.apply(this, arguments);
    }
}
const logger: (...args) => void = log;

export class MysqlDataContext implements IDataContext {
    private querySentence: any[] = [];
    private transStatus: any = [];
    private transactionOn: string;
    private interpreter: Interpreter;
    private option: IPoolConfig;
    constructor(option: IPoolConfig) {
        if (!mysqlPool) mysqlPool = mysql.createPool(option);
        this.interpreter = new Interpreter(mysql.escape);
        this.option = option;
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

    Delete(obj: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    Delete(func: any, entity?: any, params?: IQueryParameter) {
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
        if (args.length == 1) {
            return this.onSubmit(args[0]);
        }
        else if (args.length == 2) {
            let sql = args[0];
            if (this.transactionOn == 'on') {
                this.querySentence.push(sql);
            }
            else {
                return this.onSubmit(args[0]);
            }
        }
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
                    })
                }
            })
        });
    }

    async CreateTable(entity: IEntityObject) {
        let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
        sqls.push(this.CreateTableSql(entity));

        for (let sql of sqls) {
            await this.onSubmit(sql);
        }

        return true;
    }

    CreateTableSql(entity: IEntityObject) {
        let tableDefine = Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];

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

            let cs = "`" + item.ColumnName + "` " + dataType + lengthStr + " COLLATE " + (<any>this.option).collate + " " + valueStr;
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

        return "CREATE TABLE `" + entity.TableName() + "` ( " + columnSqlList.join(",") + " ) ENGINE=InnoDB DEFAULT CHARSET=" + this.option.charset + " COLLATE=" + (<any>this.option).collate + ";";
    }
    DeleteTableSql(entity: IEntityObject) {
        return "DROP TABLE IF EXISTS `" + entity.TableName() + "`;";
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