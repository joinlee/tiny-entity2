import { EntityObjectMysql } from "./mysql/entityObjectMysql";
import { EntityObjectSqlite } from "./sqlite/entityObjectSqlite";
import { EntityObject } from "./entityObject";

export class EntityObjectFactory {
    static GetEntityObjectType(dbType: string) {
        if (dbType == "nedb") {
            // let a: typeof EntityObject = require("tiny-entity/nedb").EntityObjectNeDB;
            // return a;
            return null;
        }
        else if (dbType == "mysql") {
            let entityObjectMysql: typeof EntityObject = EntityObjectMysql;
            return entityObjectMysql;
        }
        else if (dbType == "sqlite") {
            let entityObjectSqlite: typeof EntityObject = EntityObjectSqlite;
            return entityObjectSqlite;
        }
    }
}