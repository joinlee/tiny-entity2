import { IEntityObject } from './entityObject';

export interface IDataContext {
    Create(obj: IEntityObject);
    Update(obj: IEntityObject);
    Delete(obj: IEntityObject);
    Delete<T extends IEntityObject>(entity: T, func: (x: T) => boolean, paramsKey?: string[], paramsValue?: any[]);
    BeginTranscation();
    Commit();
    Query(...args);
    RollBack();
    DeleteDatabase();
}