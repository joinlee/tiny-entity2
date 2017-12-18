import { IEntityObject } from './entityObject';

export interface IDataContext {
    Create(obj: IEntityObject);
    Update(obj: IEntityObject);
    Delete(obj: IEntityObject);
    Delete<T extends IEntityObject>(func: (x: T) => boolean, entity: T, paramsKey?: string[], paramsValue?: any[]);
    BeginTranscation();
    Commit();
    Query(...args);
    RollBack();

    CreateDatabase();
    CreateTable(entity: IEntityObject);
    DeleteDatabase();
}