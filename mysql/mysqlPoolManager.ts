import { IPool } from 'mysql';
export class MysqlPoolManager {
    static Current: MysqlPoolManager = new MysqlPoolManager();
    private poolMap: Map<string, IPool> = new Map();

    CreatePool(dbName: string, pool: IPool) {
        this.poolMap.set(dbName, pool);
    }

    GetPool(dbName: string) {
        return this.poolMap.get(dbName);
    }

    HasPool(dbName: string) {
        return this.poolMap.has(dbName);
    }
}