import { IQueryObject, IJoinChildQueryObject, IQueryParameter, IQuerySelector, IQueryEnumerable, IResultQueryObject } from './../queryObject';
import { IEntityObject, EntityObject } from './../entityObject';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");
import { MysqlDataContext } from './dataContextMysql';

export class EntityObjectMysql<T extends IEntityObject> extends EntityObject<T>{
    private interpreter: Interpreter;
    protected ctx: MysqlDataContext;
    constructor(ctx?: MysqlDataContext) {
        super();
        this.interpreter = new Interpreter(mysql.escape);
        this.ctx = arguments[0][0];
    }

    Where(func: IQuerySelector<T>): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params: IQueryParameter): IQueryObject<T>;
    Where<K extends IEntityObject>(func: IQuerySelector<T>, params: IQueryParameter, entityObj: K): IQueryObject<T>;
    Where(func: any, params?: any, entityObj?: any) {
        let tableName;
        if (entityObj && !(entityObj instanceof Array)) tableName = entityObj.TableName();
        else tableName = this.TableName();
        this.interpreter.TransToSQLOfWhere(func, tableName, params);
        return this;
    }

    Select(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        this.interpreter.TransToSQLOfSelect(func, this.TableName());
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
    async ToList() {
        let sql = this.interpreter.GetFinalSql(this.toString());
        let rows = await this.ctx.Query(sql);

        // conver to entity;
        let resultList = [];
        for (let row of rows) {
            let entity = this.ConverToEntity(row);
            resultList.push(entity);
        }

        this.interpreter = new Interpreter(mysql.escape);

        return resultList;
    }
}