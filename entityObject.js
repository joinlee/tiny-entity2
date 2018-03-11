"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityObjectBase {
    First(func, params, entityObj) {
        return null;
    }
    Any(func, params) {
        return null;
    }
    Count(func, params) {
        return null;
    }
    Contains(func, values, entity) {
        return this;
    }
    IndexOf(func, entityObj) {
        return this;
    }
    Where(func, params, entityObj) {
        return this;
    }
    ConverToEntity(obj) {
        throw new Error("Method not implemented.");
    }
    TableName() {
        throw new Error("Method not implemented.");
    }
    ClassName() {
        throw new Error("Method not implemented.");
    }
    On(func, mEntity) {
        return this;
    }
    Select(func) {
        throw new Error("Method not implemented.");
    }
    OrderBy(func) {
        throw new Error("Method not implemented.");
    }
    OrderByDesc(func) {
        throw new Error("Method not implemented.");
    }
    GroupBy(func) {
        throw new Error("Method not implemented.");
    }
    Take(count) {
        throw new Error("Method not implemented.");
    }
    Skip(count) {
        throw new Error("Method not implemented.");
    }
    Join(fEntity) {
        throw new Error("Method not implemented.");
    }
    Max(func) {
        throw new Error("Method not implemented.");
    }
    Min(func) {
        throw new Error("Method not implemented.");
    }
    ToList() {
        return null;
    }
    toString() {
        throw new Error("Method not implemented.");
    }
}
exports.EntityObjectBase = EntityObjectBase;
class EntityObject extends EntityObjectBase {
}
exports.EntityObject = EntityObject;
//# sourceMappingURL=entityObject.js.map