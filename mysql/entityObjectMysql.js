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
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
        this.ctx = ctx;
    }
    Where(func, entityObj, paramsKey, paramsValue) {
        if (arguments.length == 3) {
            paramsKey = arguments[1];
            paramsValue = arguments[2];
        }
        let tableName;
        if (entityObj && !(entityObj instanceof Array))
            tableName = entityObj.TableName();
        else
            tableName = this.TableName();
        this.interpreter.TransToSQLOfWhere(func, tableName, paramsKey, paramsValue);
        return this;
    }
    Join(fEntity) {
        this.interpreter.TransToSQLOfSelect(this);
        this.interpreter.TransToSQLOfJoin(fEntity);
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
            let sql = this.interpreter.GetFinalSql(this.toString());
            console.log(sql);
            let rows = yield this.ctx.Query(sql);
            return null;
        });
    }
}
exports.EntityObjectMysql = EntityObjectMysql;
//# sourceMappingURL=entityObjectMysql.js.map