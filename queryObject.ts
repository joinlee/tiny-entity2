import { IEntityObject } from './entityObject';

export interface IQueryObject<T> extends IResultQueryObject<T>, IAssembleResultQuery<T> {
    Where(func: (entity: T) => boolean): IQueryObject<T>;
    Where(func: (entity: T) => boolean, paramsKey: string[], paramsValue: any[]): IQueryObject<T>;
    Where<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K, paramsKey?: string[], paramsValue?: any[]): IQueryObject<T>;
    Select(func: (entity: T) => void): IResultQueryObject<T>;
    OrderBy(func: (entity: T) => void): IResultQueryObject<T>
    OrderByDesc(func: (entity: T) => void): IResultQueryObject<T>;
    GroupBy(func: (entity: T) => void): IResultQueryObject<T>;
    Contains(func: (entity: T) => void, values: any[]): IResultQueryObject<T>
    Take(count: number): ITakeChildQueryObject<T>;
    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F>;
    IndexOf(func: (entity: T) => boolean): IQueryObject<T>;
    IndexOf<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K): IQueryObject<T>;
}

export interface IJoinChildQueryObject<T, F> {
    On(func: (m: T, f: F) => void): IQueryObject<T>;
    On<M extends IEntityObject>(func: (m: M, f: F) => void, mEntity: M): IQueryObject<T>;
}

export interface ITakeChildQueryObject<T> extends IResultQueryObject<T> {
    Skip(count: number): IAssembleResultQuery<T>;
}

export interface IResultQueryObject<T> {
    Max(func: (entity: T) => void): Promise<number>;
    Min(func: (entity: T) => void): Promise<number>;
    Count(func: (entity: T) => void): Promise<number>;
    Any(func: (entity: T) => boolean): Promise<number>;
    First(func: (entity: T) => boolean): Promise<number>;
}

export interface IAssembleResultQuery<T> {
    ToList(): Promise<T[]>;
    ToList<R>(): Promise<R[]>;
}