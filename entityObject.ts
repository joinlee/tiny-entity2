import { IQueryObject, IResultQueryObject, ITakeChildQueryObject, IJoinChildQueryObject, IQueryParameter, IQuerySelector, IQueryEnumerable } from './queryObject';

export abstract class EntityObjectBase<T extends IEntityObject, R> implements IEntityObject, IQueryObject<T>, IJoinChildQueryObject<T, R>{
    IndexOf(func: IQuerySelector<T>): IQueryObject<T>;
    IndexOf<K extends IEntityObject>(func: IQuerySelector<T>, entityObj: K): IQueryObject<T>;
    IndexOf(func: any, entityObj?: any) {
        return this;
    }
    Any(func: IQuerySelector<T>): Promise<number> {
        throw new Error("Method not implemented.");
    }
    First(func: IQuerySelector<T>): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Where(func: IQuerySelector<T>): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params: IQueryParameter): IQueryObject<T>;
    Where<K extends IEntityObject>(func: IQuerySelector<T>, params: IQueryParameter, entityObj: K): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params?: any, entityObj?: any) {
        return this;
    }

    ConverToEntity<T>(obj: any): T {
        throw new Error("Method not implemented.");
    }
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

    Select(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    OrderBy(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    OrderByDesc(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    GroupBy(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Contains(func: IQueryEnumerable<T>, values: any[]): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Take(count: number): ITakeChildQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F> {
        throw new Error("Method not implemented.");
    }


    Max(func: IQueryEnumerable<T>): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Min(func: IQueryEnumerable<T>): Promise<number> {
        throw new Error("Method not implemented.");
    }
    Count(func: IQueryEnumerable<T>): Promise<number> {
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
    ClassName(): string;
    TableName(): string;
    ConverToEntity<T>(obj: any): T;
}

