"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
MysqlPoolManager.Current = new MysqlPoolManager();
exports.MysqlPoolManager = MysqlPoolManager;
//# sourceMappingURL=mysqlPoolManager.js.map