import { IQueryObject, IJoinChildQueryObject, IQueryParameter, IQuerySelector, IQueryEnumerable, IResultQueryObject, ITakeChildQueryObject, IAssembleResultQuery } from './../queryObject';
import { IEntityObject, EntityObject } from './../entityObject';
import { Interpreter } from '../interpreter';
import * as mysql from "mysql";
import { MysqlDataContext } from './dataContextMysql';
import { Define } from '../define/dataDefine';

export class EntityObjectMysql<T extends IEntityObject> extends EntityObject<T>{
    private interpreter: Interpreter;
    protected ctx: MysqlDataContext;
    private joinEntities = [];
    constructor(ctx?: MysqlDataContext) {
        super();
        this.interpreter = new Interpreter(mysql.escape);
        this.ctx = arguments[0][0];
    }

    Take(count: number): ITakeChildQueryObject<T> {
        this.interpreter.TransToSQLOfLimt(count);
        return this;
    }
    Skip(count: number): IAssembleResultQuery<T> {
        this.interpreter.TransToSQLOfLimt(count, true);
        return this;
    }

    Where(func: IQuerySelector<T>): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params: IQueryParameter): IQueryObject<T>;
    Where<K extends IEntityObject>(func: IQuerySelector<K>, params: IQueryParameter, entityObj: K): IQueryObject<T>;
    Where(func: any, params?: any, entityObj?: any) {
        this.interpreter.TransToSQLOfWhere(func, this.GetTableName(entityObj), params);
        return this;
    }


    First(): Promise<T>;
    First(func: IQuerySelector<T>): Promise<T>;
    First(func: IQuerySelector<T>, params: IQueryParameter): Promise<T>;
    First<K extends IEntityObject>(func: IQuerySelector<T>, params: IQueryParameter, entityObj: K): Promise<T>;
    async First(func?: any, params?: any, entityObj?: any) {
        if (func) {
            this.Where(func, params, entityObj);
        }
        this.Take(1);

        let r = await this.ToList();
        if (r.length === 0) return null;
        return r[0];
    }

    Count(): Promise<number>;
    Count(func: IQuerySelector<T>): Promise<number>;
    Count(func: IQuerySelector<T>, params: IQueryParameter): Promise<number>;
    async Count(func?: any, params?: any) {
        if (func) {
            this.Where(func, params);
        }
        this.interpreter.TransToSQLCount(this);
        let sql = this.interpreter.GetFinalSql(this.TableName());
        let r = await this.ctx.Query(sql);
        let result = 0;
        for (let key of Object.keys(r[0])) {
            result = r[0][key];
        }

        this.Disposed();
        return result;
    }

    Any(): Promise<boolean>;
    Any(func: IQuerySelector<T>): Promise<boolean>;
    Any(func: IQuerySelector<T>, params: IQueryParameter): Promise<boolean>;
    async Any(func?: any, params?: any) {
        let count = await this.Count(func, params);
        return count > 0;
    }

    Contains(func: IQueryEnumerable<T>, values: any[]): IResultQueryObject<T>;
    Contains<K extends IEntityObject>(func: IQueryEnumerable<K>, values: any[], entity: K): IResultQueryObject<T>;
    Contains(func: any, values: any, entity?: any) {
        if (values && values.length == 0) throw new Error("values can not be null or length equals 0!");
        let tbaleName;
        if (entity) tbaleName = entity.TableName();
        else tbaleName = this.TableName();
        this.interpreter.TransToSQLOfContains(func, values, tbaleName);
        return this;
    }

    Select(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        this.interpreter.TransToSQLOfSelect(func, this.TableName());
        this.joinEntities = [];
        return this;
    }

    OrderBy(func: IQueryEnumerable<T>): IQueryObject<T> {
        this.interpreter.TransTOSQLOfGroup(func, this.TableName());
        return this;
    }
    OrderByDesc(func: IQueryEnumerable<T>): IQueryObject<T> {
        this.interpreter.TransTOSQLOfGroup(func, this.TableName(), true);
        return this;
    }

    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F> {
        if (this.joinEntities.length == 0) {
            this.interpreter.TransToSQLOfSelect(this);
        }
        this.interpreter.TransToSQLOfJoin(fEntity);
        this.joinEntities.push(fEntity);
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
        let sql = this.interpreter.GetFinalSql(this.TableName());
        let rows = await this.ctx.Query(sql);
        let resultList = [];

        if (this.joinEntities.length > 0) {
            if (rows.length > 0) {
                let r = this.TransRowToEnity(rows);
                resultList = this.SplitColumnList(r);
            }
        }
        else {
            for (let row of rows) {
                let entity = this.ConverToEntity(row);
                resultList.push(entity);
            }
        }

        this.Disposed();

        return resultList;
    }

    private SplitColumnList(dataList: any[]) {
        let objectNameList: string[] = [];
        let resultValue = {};
        if (dataList.length > 0) {
            let dataItem = dataList[0];
            objectNameList = Object.keys(dataItem);

            dataList.map(item => {
                for (let key of objectNameList) {
                    resultValue[key] || (resultValue[key] = { list: [], mapping: null, pKey: null, fkey: null });
                    let mdata = Define.DataDefine.Current.GetMetedata(item[key]);
                    let pKey = mdata.find(x => x.IsPrimaryKey);
                    let mapping = mdata.filter(x => x.Mapping != null || x.Mapping != undefined);
                    if (resultValue[key].list.findIndex(x => x[pKey.ColumnName] === item[key][pKey.ColumnName])) {
                        resultValue[key].pKey = pKey;
                        resultValue[key].mapping = mapping ? mapping : null;
                        resultValue[key].list.push(item[key]);
                    }
                }
            })
        }

        for (let key in resultValue) {
            let obj = resultValue[key];
            if (obj.mapping) {
                let mapping: Define.PropertyDefineOption[] = obj.mapping;
                let list = this.RemoveDuplicate(obj.list, obj.pKey.ColumnName);
                obj.list = list;
                for (let item of list) {
                    for (let mappingItem of mapping) {
                        if (!resultValue[mappingItem.Mapping]) continue;
                        if (mappingItem.MappingType == Define.MappingType.Many) {
                            let mappingKey = mappingItem.MappingKey;
                            let mkey = obj.pKey.ColumnName, fkey;
                            if (typeof (mappingKey) == "string") fkey = mappingKey;
                            else {
                                fkey = mappingKey.FKey;
                                if (mappingKey.MKey) mkey = mappingKey.MKey;
                            }

                            item[mappingItem.ColumnName] = this.RemoveDuplicate(resultValue[mappingItem.Mapping].list.filter(x => x[fkey] == item[mkey]), obj.pKey.ColumnName);
                        }
                        else if (mappingItem.MappingType == Define.MappingType.One) {
                            let mappingKey = mappingItem.MappingKey;
                            if (mappingKey) {
                                item[mappingItem.ColumnName] = resultValue[mappingItem.Mapping].list.find(x => x[(<any>mappingKey).FKey] == item[(<any>mappingKey).MKey]);
                            }
                            else {
                                let mainTableName = item.ClassName().toLowerCase();
                                item[mappingItem.ColumnName] = resultValue[mappingItem.Mapping].list.find(x => x[mainTableName] == item[obj.pKey.ColumnName]);
                            }

                        }
                    }
                }
            }
        }

        return resultValue[this.ClassName()].list;
    }

    private RemoveDuplicate(list: any[], key: string) {
        let rList = [];
        for (let item of list) {
            if (rList.findIndex(x => x[key] == item[key]) == -1) {
                rList.push(item);
            }
        }

        return rList;
    }

    private TransRowToEnity(rows: any[]) {
        let resultList = [];

        for (let row of rows) {
            let obj = {};
            for (let key in row) {
                let kv = key.split("_");
                if (!obj[kv[0]]) {
                    obj[kv[0]] = this.ctx.GetEntityInstance(kv[0]);
                }

                obj[kv[0]][kv[1]] = row[key];
            }
            for(let item in obj){
                obj[item].ConverToEntity(obj[item]);
            }
            resultList.push(obj);
        }

        return resultList;
    }
    private GetTableName(entityObj) {
        let tableName;
        if (entityObj && !(entityObj instanceof Array)) tableName = entityObj.TableName();
        else tableName = this.TableName();

        return tableName;
    }

    private Disposed() {
        this.interpreter = new Interpreter(mysql.escape);
        this.joinEntities = [];
    }
}