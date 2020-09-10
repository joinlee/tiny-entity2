"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlPoolManager = void 0;
class MysqlPoolManager {
    constructor() {
        this.poolMap = new Map();
    }
    CreatePool(dbName, pool) {
        this.poolMap.set(dbName, pool);
    }
    GetPool(dbName) {
        return this.poolMap.get(dbName);
    }
    HasPool(dbName) {
        return this.poolMap.has(dbName);
    }
}
exports.MysqlPoolManager = MysqlPoolManager;
MysqlPoolManager.Current = new MysqlPoolManager();
//# sourceMappingURL=mysqlPoolManager.js.map