import { IEntityObject } from './entityObject';
import { IQueryParameter, IQuerySelector } from './queryObject';

export interface IDataContext {
    Create<T extends IEntityObject>(entity: T): Promise<T>;
    Create<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    Update<T extends IEntityObject>(entity: T): Promise<T>;
    Update<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    Delete(entity: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    BeginTranscation();
    Commit();
    Query(...args);
    RollBack();

    CreateDatabase();
    CreateTable(entity: IEntityObject);
    DeleteDatabase();
}