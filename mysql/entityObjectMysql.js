"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entityObject_1 = require("./../entityObject");
const interpreter_1 = require("../interpreter");
const mysql = require("mysql");
class EntityObjectMysql extends entityObject_1.EntityObject {
    constructor() {
        super();
        this.interpreter = new interpreter_1.Interpreter(mysql.escape);
    }
    Where(func, entityObj, paramsKey, paramsValue) {
        if (arguments.length == 3) {
            paramsKey = arguments[1];
            paramsValue = arguments[2];
        }
        let tableName;
        if (entityObj && !(entityObj instanceof Array))
            tableName = entityObj.toString();
        else
            tableName = this.toString();
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
        let sql = this.interpreter.GetFinalSql(this.toString());
        console.log(sql);
        return null;
    }
}
exports.EntityObjectMysql = EntityObjectMysql;
//# sourceMappingURL=entityObjectMysql.js.map