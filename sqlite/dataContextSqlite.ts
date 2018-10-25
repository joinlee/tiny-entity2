import { IDataContext } from '../dataContext';
import { IEntityObject } from '../entityObject';
import { IQueryParameter, IQuerySelector } from '../queryObject';
import * as sqlite from 'sqlite3';
import { Define } from '../define/dataDefine';
let sqlite3 = sqlite.verbose();

export class SqliteDataContext implements IDataContext {
    private db: sqlite.Database;
    private option;
    constructor(option) {
        this.option = option;
        this.db = new sqlite3.Database(option.database);
    }
    Create<T extends IEntityObject>(entity: T): Promise<T>;
    Create<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    Create(entity: any, excludeFields?: any) {
        return null;
    }
    Update<T extends IEntityObject>(entity: T): Promise<T>;
    Update<T extends IEntityObject>(entity: T, excludeFields: string[]): Promise<T>;
    Update(entity: any, excludeFields?: any) {
        return null;
    }
    Delete(entity: IEntityObject);
    Delete<T extends IEntityObject>(func: IQuerySelector<T>, entity: T, params?: IQueryParameter);
    Delete(func: any, entity?: any, params?: any) {
        throw new Error("Method not implemented.");
    }
    BeginTranscation() {
        throw new Error("Method not implemented.");
    }
    Commit() {
        throw new Error("Method not implemented.");
    }
    Query(...args: any[]) {
        throw new Error("Method not implemented.");
    }
    RollBack() {
        throw new Error("Method not implemented.");
    }
    CreateDatabase() {
        // throw new Error("Method not implemented.");
    }
    CreateTable(entity: IEntityObject) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
                sqls.push(this.CreateTableSql(entity));
    
                for (let sql of sqls) {
                    this.db.run(sql);
                }
    
                return resolve(true);
            });

            // this.db.close();
        });
    }
    CreateTableSql(entity: IEntityObject) {
        let tableDefine = Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];
        let indexColumns = [];

        for (let item of tableDefine) {
            if (item.Mapping) continue;
            let valueStr = item.NotAllowNULL ? "NOT NULL" : "DEFAULT NULL";

            let lengthStr = "";
            if (item.DataLength != undefined) {
                let dcp = item.DecimalPoint != undefined ? "," + item.DecimalPoint : "";
                lengthStr = "(" + item.DataLength + dcp + ")";
            }

            if (item.DefaultValue != undefined) {
                if (item.DataType >= 0 && item.DataType <= 1) {
                    //string type
                    valueStr = "DEFAULT '" + item.DefaultValue + "'";
                }
                else {
                    //number type
                    valueStr = "DEFAULT " + item.DefaultValue;
                }
            }

            let dataType = Define.DataType[item.DataType];
            if (item.DataType == Define.DataType.Array) {
                dataType = 'VARCHAR';
            }
            else if (item.DataType == Define.DataType.JSON) {
                dataType = 'TEXT';
            }

            let primaryKey = '';
            if (item.IsPrimaryKey) {
                primaryKey = 'PRIMARY KEY';
            }

            let cs = `${item.ColumnName} ${primaryKey} ${dataType}${lengthStr} ${valueStr}`;

            if (item.ForeignKey && item.ForeignKey.IsPhysics) {
                let f = `FOREIGN KEY(${item.ColumnName }) REFERENCES ${item.ForeignKey.ForeignTable}(${item.ForeignKey.ForeignColumn})`;
                columnSqlList.push(f);
            }
            if (item.IsIndex) {
                indexColumns.push(`CREATE INDEX idx_${item.ColumnName} ON ${entity.TableName()}(${item.ColumnName});`);
            }

            columnSqlList.push(cs);
        }

        let sql = `
        CREATE TABLE ${entity.TableName()}(
            ${columnSqlList.join(',\n')}
        );
        ${indexColumns.join('\n')}
        `;
        return sql;
    }
    DeleteDatabase() {
        throw new Error("Method not implemented.");
    }
}