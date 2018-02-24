import { IEntityObject } from './entityObject';
import { IQueryParameter, IQuerySelector } from './queryObject';

export interface IDataContext {
    Create<T extends IEntityObject>(obj: T): Promise<T>
    Update(obj: IEntityObject);
    Delete(obj: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    BeginTranscation();
    Commit();
    Query(...args);
    RollBack();

    CreateDatabase();
    CreateTable(entity: IEntityObject);
    DeleteDatabase();
}