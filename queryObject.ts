import { IEntityObject } from './entityObject';

export interface IQueryObject<T> extends IResultQueryObject<T>, IAssembleResultQuery<T> {
    Where(func: IQuerySelector<T>): IQueryObject<T>;
    Where(func: IQuerySelector<T>, params: IQueryParameter): IQueryObject<T>;
    Where<K extends IEntityObject>(func: IQuerySelector<K>, params: IQueryParameter, entityObj: K): IQueryObject<T>;
    Select(func: IQueryEnumerable<T>): IResultQueryObject<T>;
    OrderBy(func: IQueryEnumerable<T>): IResultQueryObject<T>
    OrderByDesc(func: IQueryEnumerable<T>): IResultQueryObject<T>;
    GroupBy(func: IQueryEnumerable<T>): IResultQueryObject<T>;
    Contains(func: IQueryEnumerable<T>, values: any[]): IResultQueryObject<T>;
    Contains<K extends IEntityObject>(func: IQueryEnumerable<K>, values: any[], entity: K): IResultQueryObject<T>;
    Take(count: number): ITakeChildQueryObject<T>;
    Join<F extends IEntityObject>(fEntity: F): IJoinChildQueryObject<T, F>;
    IndexOf(func: IQuerySelector<T>): IQueryObject<T>;
    IndexOf<K extends IEntityObject>(func: IQuerySelector<T>, entityObj: K): IQueryObject<T>;
}

export interface IJoinChildQueryObject<T, F> {
    On(func: (m: T, f: F) => void): IQueryObject<T>;
    On<M extends IEntityObject>(func: (m: M, f: F) => void, mEntity: M): IQueryObject<T>;
}

export interface ITakeChildQueryObject<T> extends IResultQueryObject<T> {
    Skip(count: number): IAssembleResultQuery<T>;
}

export interface IResultQueryObject<T> extends IAssembleResultQuery<T> {
    Max(func: IQueryEnumerable<T>): Promise<number>;
    Min(func: IQueryEnumerable<T>): Promise<number>;

    Count(): Promise<number>;
    Count(func: IQuerySelector<T>): Promise<number>;
    Count(func: IQuerySelector<T>, params: IQueryParameter): Promise<number>;

    Any(): Promise<boolean>;
    Any(func: IQuerySelector<T>): Promise<boolean>;
    Any(func: IQuerySelector<T>, params: IQueryParameter): Promise<boolean>;
   
    First(func: IQuerySelector<T>): Promise<T>;
    First(func: IQuerySelector<T>, params: IQueryParameter): Promise<T>;
    First<K extends IEntityObject>(func: IQuerySelector<T>, params: IQueryParameter, entityObj: K): Promise<T>;
}

export interface IAssembleResultQuery<T> {
    ToList(): Promise<T[]>;
    ToList<R>(): Promise<R[]>;
}

export interface IQueryParameter {

}

export interface IQuerySelector<T> {
    (entity: T): boolean | number;
}

export interface IQueryEnumerable<T> {
    (entity: T): void;
}
