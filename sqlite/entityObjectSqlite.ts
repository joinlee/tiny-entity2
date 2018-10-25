import { IEntityObject, EntityObject } from "../entityObject";
import { SqliteDataContext } from "./dataContextSqlite";

export class EntityObjectSqlite<T extends IEntityObject> extends EntityObject<T> {
    constructor(ctx?: SqliteDataContext) {
        super();
    }
}