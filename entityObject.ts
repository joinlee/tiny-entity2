import { IQueryObject, IResultQueryObject, ITakeChildQueryObject, IJoinChildQueryObject } from './queryObject';

export abstract class EntityObjectBase<T extends IEntityObject, R> implements IEntityObject, IQueryObject<T>, IJoinChildQueryObject<T, R>{
    TableName(): string {
        throw new Error("Method not implemented.");
    }
    ClassName(): string {
        throw new Error("Method not implemented.");
    }
    On(func: (m: T, f: R) => void): IQueryObject<T>;
    On<M extends IEntityObject>(func: (m: M, f: R) => void, mEntity: M): IQueryObject<T>;
    On(func: any, mEntity?: any) {
        return this;
    }

    Where(func: (entity: T) => boolean): IQueryObject<T>;
    Where(func: (entity: T) => boolean, paramsKey: string[], paramsValue: any[]): IQueryObject<T>;
    Where<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K, paramsKey: string[], paramsValue?: any[]): IQueryObject<T>;
    Where(func: any, entityObj?: any, paramsKey?: any, paramsValue?: any) {
        return this;
    }
    Clone(obj: any): void {
        throw new Error("Method not implemented.");
    }

    Select(func: (entity: T) => void): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    OrderBy(func: (entity: T) => void): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    OrderByDesc(func: (entity: T) => void): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    GroupBy(func: (entity: T) => void): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Contains(func: (entity: T) => void, values: any[]): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Take(count: number): ITakeChildQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F> {
        throw new Error("Method not implemented.");
    }

    IndexOf(func: (entity: T) => boolean): IQueryObject<T>;
    IndexOf<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K): IQueryObject<T>;
    IndexOf(func: any, entityObj?: any) {
        return this;
    }
    Max(func: (entity: T) => void): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Min(func: (entity: T) => void): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Count(func: (entity: T) => void): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Any(func: (entity: T) => boolean): Promise<number> {
        throw new Error("Method not implemented.");
    }
    First(func: (entity: T) => boolean): Promise<number> {
        throw new Error("Method not implemented.");
    }
    ToList(): Promise<T[]>;
    ToList<R>(): Promise<R[]>;
    ToList() {
        return null;
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }
}

export abstract class EntityObject<T extends IEntityObject> extends EntityObjectBase<T, null> { }

export interface IEntityObject {
    toString(): string;
    Clone(obj: any): void;
    ClassName(): string;
    TableName(): string;
}

