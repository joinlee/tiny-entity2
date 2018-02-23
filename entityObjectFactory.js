"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class EntityObjectFactory {
    static GetEntityObjectType(dbType) {
        if (dbType == "nedb") {
            return null;
        }
        else if (dbType == "mysql") {
            let entityObjectMysql = _1.EntityObjectMysql;
            return entityObjectMysql;
        }
        else if (dbType == "sqlite") {
            return null;
        }
    }
}
exports.EntityObjectFactory = EntityObjectFactory;
//# sourceMappingURL=entityObjectFactory.js.map