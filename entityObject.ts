import { IQueryObject, IResultQueryObject, ITakeChildQueryObject, IJoinChildQueryObject, IQueryParameter, IQuerySelector, IQueryEnumerable, IAssembleResultQuery } from './queryObject';

export abstract class EntityObjectBase<T extends IEntityObject, R> implements IEntityObject, IQueryObject<T>, IJoinChildQueryObject<T, R>, ITakeChildQueryObject<T>{
    First(): Promise<T>;
    First(func: IQuerySelector<T>): Promise<T>;
    First(func: IQuerySelector<T>, params: IQueryParameter): Promise<T>;
    First<K extends IEntityObject>(func: IQuerySelector<T>, params: IQueryParameter, entityObj: K): Promise<T>;
    First(func?: any, params?: any, entityObj?: any) {
        return null;
    }
    Any(): Promise<boolean>;
    Any(func: IQuerySelector<T>): Promise<boolean>;
    Any(func: IQuerySelector<T>, params: IQueryParameter): Promise<boolean>;
    Any(func?: any, params?: any) {
        return null;
    }
    Count(): Promise<number>;
    Count(func: IQuerySelector<T>): Promise<number>;
    Count(func: IQuerySelector<T>, params: IQueryParameter): Promise<number>;
    Count(func?: any, params?: any) {
        return null;
    }

    Contains(func: IQueryEnumerable<T>, values: any[]): IResultQueryObject<T>;
    Contains<K extends IEntityObject>(func: IQueryEnumerable<K>, values: any[], entity: K): IResultQueryObject<T>;
    Contains(func: any, values: any, entity?: any) {
        return this;
    }
    IndexOf(func: IQuerySelector<T>): IQueryObject<T>;
    IndexOf<K extends IEntityObject>(func: IQuerySelector<T>, entityObj: K): IQueryObject<T>;
    IndexOf(func: any, entityObj?: any) {
        return this;
    }
    Where(func: IQuerySelector<T>): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params: IQueryParameter): IQueryObject<T>;
    Where<K extends IEntityObject>(func: IQuerySelector<K>, params: IQueryParameter, entityObj: K): IQueryObject<T>;
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
    OrderBy(func: IQueryEnumerable<T>): IQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    OrderByDesc(func: IQueryEnumerable<T>): IQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    GroupBy(func: IQueryEnumerable<T>): IResultQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Take(count: number): ITakeChildQueryObject<T> {
        throw new Error("Method not implemented.");
    }
    Skip(count: number): IAssembleResultQuery<T> {
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

