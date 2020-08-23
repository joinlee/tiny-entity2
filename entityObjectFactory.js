"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entityObjectMysql_1 = require("./mysql/entityObjectMysql");
const entityObjectSqlite_1 = require("./sqlite/entityObjectSqlite");
class EntityObjectFactory {
    static GetEntityObjectType(dbType) {
        if (dbType == "nedb") {
            return null;
        }
        else if (dbType == "mysql") {
            let entityObjectMysql = entityObjectMysql_1.EntityObjectMysql;
            return entityObjectMysql;
        }
        else if (dbType == "sqlite") {
            let entityObjectSqlite = entityObjectSqlite_1.EntityObjectSqlite;
            return entityObjectSqlite;
        }
    }
}
exports.EntityObjectFactory = EntityObjectFactory;
//# sourceMappingURL=entityObjectFactory.js.map