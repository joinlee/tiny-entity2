import { IEntityObject } from './entityObject';

export interface IQueryObject<T> extends IResultQueryObject<T> {
    Where(func: (entity: T) => boolean): IQueryObject<T>;
    Where<K extends IEntityObject>(func: (entity: K) => boolean, entityObj: K): IQueryObject<T>;
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

export interface IJoinChildQueryObject<T, K> {
    On(func: (mEntity: T, fEntity: K) => boolean): IQueryObject<T>;
}

export interface ITakeChildQueryObject<T> extends IResultQueryObject<T> {
    Skip(count: number): IAssembleResultQuery<T>;
}

export interface IResultQueryObject<T> extends IAssembleResultQuery<T> {
    Max(func: (entity: T) => void): Promise<number>;
    Min(func: (entity: T) => void): Promise<number>;
    Count(func: (entity: T) => void): Promise<number>;
    Any(func: (entity: T) => boolean): Promise<number>;
    First(func: (entity: T) => boolean): Promise<number>;
}

export interface IAssembleResultQuery<T> {
    ToList(): Promise<T[]>;
    ToList<R>(): Promise<R[]>
}