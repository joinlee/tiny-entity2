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
const entityObject_1 = require("./../entityObject");
const interpreter_1 = require("../interpreter");
const mysql = require("mysql");
class EntityObjectMysql extends entityObject_1.EntityObject {
    constructor(ctx) {
        super();
        this.joinEntities = [];
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
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
    First(func, params, entityObj) {
        return __awaiter(this, void 0, void 0, function* () {
            let r = yield this.Where(func, params, entityObj).Take(1).ToList();
            if (r.length === 0)
                return null;
            return r[0];
        });
    }
    Count(func, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Where(func, params);
            this.interpreter.TransToSQLCount(this.TableName());
            let sql = this.interpreter.GetFinalSql(this.TableName());
            let r = yield this.ctx.Query(sql);
            let result = r ? r[0][0] : 0;
            this.Disposed();
            return result;
        });
    }
    Any(func, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = yield this.Count(func, params);
            return count > 0;
        });
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
    OrderBy(func) {
        this.interpreter.TransTOSQLOfGroup(func, this.TableName());
        return this;
    }
    OrderByDesc(func) {
        this.interpreter.TransTOSQLOfGroup(func, this.TableName(), true);
        return this;
    }
    Join(fEntity) {
        this.interpreter.TransToSQLOfSelect(this);
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
    ToList() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.interpreter.GetFinalSql(this.TableName());
            let rows = yield this.ctx.Query(sql);
            let resultList = [];
            if (this.joinEntities.length > 0) {
                resultList = this.TransRowToEnity(rows);
            }
            else {
                for (let row of rows) {
                    let entity = this.ConverToEntity(row);
                    resultList.push(entity);
                }
            }
            this.Disposed();
            return resultList;
        });
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
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
        this.joinEntities = [];
    }
}
exports.EntityObjectMysql = EntityObjectMysql;
//# sourceMappingURL=entityObjectMysql.js.map