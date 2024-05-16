"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityObjectSqlite = void 0;
const entityObject_1 = require("../entityObject");
const interpreter_1 = require("../interpreter");
const dataDefine_1 = require("../define/dataDefine");
const sqlstring = require("sqlstring-sqlite");
class EntityObjectSqlite extends entityObject_1.EntityObject {
    constructor(ctx) {
        super();
        this.joinEntities = [];
        this.interpreter = new interpreter_1.Interpreter(sqlstring.escape);
        this.ctx = arguments[0][0];
    }
    Take(count) {
        this.interpreter.TransToSQLOfLimt(count);
        return this;
    }
    Skip(count) {
        this.interpreter.TransToSQLOfLimt(count, true);
        return this;
    }
    Where(func, params, entityObj) {
        this.interpreter.TransToSQLOfWhere(func, this.GetTableName(entityObj), params);
        return this;
    }
    async First(func, params, entityObj) {
        if (func) {
            this.Where(func, params, entityObj);
        }
        this.Take(1);
        let r = await this.ToList();
        if (r.length === 0)
            return null;
        return r[0];
    }
    async Count(func, params) {
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
    async Any(func, params) {
        let count = await this.Count(func, params);
        return count > 0;
    }
    Contains(func, values, entity) {
        if (values && values.length == 0)
            throw new Error("values can not be null or length equals 0!");
        let tbaleName;
        if (entity)
            tbaleName = entity.TableName();
        else
            tbaleName = this.TableName();
        this.interpreter.TransToSQLOfContains(func, values, tbaleName);
        return this;
    }
    Select(func) {
        this.interpreter.TransToSQLOfSelect(func, this.TableName());
        this.joinEntities = [];
        return this;
    }
    OrderBy(func, entity) {
        let tableName;
        if (entity) {
            tableName = entity.TableName();
        }
        else {
            tableName = this.TableName();
        }
        this.interpreter.TransTOSQLOfGroup(func, tableName);
        return this;
    }
    OrderByDesc(func, entity) {
        let tableName;
        if (entity) {
            tableName = entity.TableName();
        }
        else {
            tableName = this.TableName();
        }
        this.interpreter.TransTOSQLOfGroup(func, tableName, true);
        return this;
    }
    Join(fEntity) {
        if (this.joinEntities.length == 0) {
            this.interpreter.TransToSQLOfSelect(this);
        }
        this.interpreter.TransToSQLOfJoin(fEntity);
        this.joinEntities.push(fEntity);
        return this;
    }
    On(func, mEntity) {
        let mTableName;
        if (mEntity)
            mTableName = mEntity.toString();
        else
            mTableName = this.toString();
        this.interpreter.TransToSQLOfOn(func, mTableName);
        return this;
    }
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
    SplitColumnList(dataList) {
        let objectNameList = [];
        let resultValue = {};
        if (dataList.length > 0) {
            let dataItem = dataList[0];
            objectNameList = Object.keys(dataItem);
            dataList.map(item => {
                for (let key of objectNameList) {
                    resultValue[key] || (resultValue[key] = { list: [], mapping: null, pKey: null, fkey: null });
                    let mdata = dataDefine_1.Define.DataDefine.Current.GetMetedata(item[key]);
                    let pKey = mdata.find(x => x.IsPrimaryKey);
                    let mapping = mdata.filter(x => x.Mapping != null || x.Mapping != undefined);
                    if (resultValue[key].list.findIndex(x => x[pKey.ColumnName] === item[key][pKey.ColumnName])) {
                        resultValue[key].pKey = pKey;
                        resultValue[key].mapping = mapping ? mapping : null;
                        resultValue[key].list.push(item[key]);
                    }
                }
            });
        }
        for (let key in resultValue) {
            let obj = resultValue[key];
            if (obj.mapping) {
                let mapping = obj.mapping;
                let list = this.RemoveDuplicate(obj.list, obj.pKey.ColumnName);
                obj.list = list;
                for (let item of list) {
                    for (let mappingItem of mapping) {
                        if (!resultValue[mappingItem.Mapping])
                            continue;
                        if (mappingItem.MappingType == dataDefine_1.Define.MappingType.Many) {
                            let mappingKey = mappingItem.MappingKey;
                            let mkey = obj.pKey.ColumnName, fkey;
                            if (typeof (mappingKey) == "string")
                                fkey = mappingKey;
                            else {
                                fkey = mappingKey.FKey;
                                if (mappingKey.MKey)
                                    mkey = mappingKey.MKey;
                            }
                            item[mappingItem.ColumnName] = this.RemoveDuplicate(resultValue[mappingItem.Mapping].list.filter(x => x[fkey] == item[mkey]), obj.pKey.ColumnName);
                        }
                        else if (mappingItem.MappingType == dataDefine_1.Define.MappingType.One) {
                            let mappingKey = mappingItem.MappingKey;
                            if (mappingKey) {
                                item[mappingItem.ColumnName] = resultValue[mappingItem.Mapping].list.find(x => x[mappingKey.FKey] == item[mappingKey.MKey]);
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
    RemoveDuplicate(list, key) {
        let rList = [];
        for (let item of list) {
            if (rList.findIndex(x => x[key] == item[key]) == -1) {
                rList.push(item);
            }
        }
        return rList;
    }
    TransRowToEnity(rows) {
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
            for (let item in obj) {
                obj[item].ConverToEntity(obj[item]);
            }
            resultList.push(obj);
        }
        return resultList;
    }
    GetTableName(entityObj) {
        let tableName;
        if (entityObj && !(entityObj instanceof Array))
            tableName = entityObj.TableName();
        else
            tableName = this.TableName();
        return tableName;
    }
    Disposed() {
        this.interpreter = new interpreter_1.Interpreter(sqlstring.escape);
        this.joinEntities = [];
    }
}
exports.EntityObjectSqlite = EntityObjectSqlite;
//# sourceMappingURL=entityObjectSqlite.js.map