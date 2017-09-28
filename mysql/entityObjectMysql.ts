import { IQueryObject, IJoinChildQueryObject } from './../queryObject';
import { IEntityObject, EntityObject } from './../entityObject';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");

export class EntityObjectMysql<T extends IEntityObject> extends EntityObject<T>{
    private interpreter: Interpreter;
    constructor() {
        super();
        this.interpreter = new Interpreter(mysql.escape);
    }
    Where(func: (entity: T) => boolean): IQueryObject<T>;
    Where(func: (entity: T) => boolean, paramsKey?: string[], paramsValue?: any[]): IQueryObject<T>;
    Where<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K, paramsKey?: string[], paramsValue?: any[]): IQueryObject<T>;
    Where(func: any, entityObj?: any, paramsKey?: any, paramsValue?: any) {
        if (arguments.length == 3) {
            paramsKey = arguments[1];
            paramsValue = arguments[2];
        }
        let tableName;
        if (entityObj && !(entityObj instanceof Array)) tableName = entityObj.toString();
        else tableName = this.toString();
        this.interpreter.TransToSQLOfWhere(func, tableName, paramsKey, paramsValue);
        return this;
    }
    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F> {
        this.interpreter.TransToSQLOfSelect(this);
        this.interpreter.TransToSQLOfJoin(fEntity);
        return this;
    }
    On<F extends IEntityObject>(func: (m: T, f: F) => void): IQueryObject<T>;
    On<M extends IEntityObject, F extends IEntityObject>(func: (m: M, f: F) => void, mEntity: M): IQueryObject<T>;
    On(func: any, mEntity?: any) {
        let mTableName;
        if (mEntity) mTableName = mEntity.toString();
        else mTableName = this.toString();
        this.interpreter.TransToSQLOfOn(func, mTableName);
        return this;
    }

    ToList(): Promise<T[]>;
    ToList<R>(): Promise<R[]>;
    ToList() {
        let sql = this.interpreter.GetFinalSql(this.toString());
        console.log(sql);
        return null;
    }
}