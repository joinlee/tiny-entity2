"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite = require("sqlite3");
const dataDefine_1 = require("../define/dataDefine");
let sqlite3 = sqlite.verbose();
class SqliteDataContext {
    constructor(option) {
        this.option = option;
        this.db = new sqlite3.Database(option.database);
    }
    Create(entity, excludeFields) {
        return null;
    }
    Update(entity, excludeFields) {
        return null;
    }
    Delete(func, entity, params) {
        throw new Error("Method not implemented.");
    }
    BeginTranscation() {
        throw new Error("Method not implemented.");
    }
    Commit() {
        throw new Error("Method not implemented.");
    }
    Query(...args) {
        throw new Error("Method not implemented.");
    }
    RollBack() {
        throw new Error("Method not implemented.");
    }
    CreateDatabase() {
    }
    CreateTable(entity) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let sqls = ["DROP TABLE IF EXISTS `" + entity.TableName() + "`;"];
                sqls.push(this.CreateTableSql(entity));
                for (let sql of sqls) {
                    this.db.run(sql);
                }
                return resolve(true);
            });
        });
    }
    CreateTableSql(entity) {
        let tableDefine = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
        let columnSqlList = [];
        let indexColumns = [];
        for (let item of tableDefine) {
            if (item.Mapping)
                continue;
            let valueStr = item.NotAllowNULL ? "NOT NULL" : "DEFAULT NULL";
            let lengthStr = "";
            if (item.DataLength != undefined) {
                let dcp = item.DecimalPoint != undefined ? "," + item.DecimalPoint : "";
                lengthStr = "(" + item.DataLength + dcp + ")";
            }
            if (item.DefaultValue != undefined) {
                if (item.DataType >= 0 && item.DataType <= 1) {
                    valueStr = "DEFAULT '" + item.DefaultValue + "'";
                }
                else {
                    valueStr = "DEFAULT " + item.DefaultValue;
                }
            }
            let dataType = dataDefine_1.Define.DataType[item.DataType];
            if (item.DataType == dataDefine_1.Define.DataType.Array) {
                dataType = 'VARCHAR';
            }
            else if (item.DataType == dataDefine_1.Define.DataType.JSON) {
                dataType = 'TEXT';
            }
            let primaryKey = '';
            if (item.IsPrimaryKey) {
                primaryKey = 'PRIMARY KEY';
            }
            let cs = `${item.ColumnName} ${primaryKey} ${dataType}${lengthStr} ${valueStr}`;
            if (item.ForeignKey && item.ForeignKey.IsPhysics) {
                let f = `FOREIGN KEY(${item.ColumnName}) REFERENCES ${item.ForeignKey.ForeignTable}(${item.ForeignKey.ForeignColumn})`;
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
exports.SqliteDataContext = SqliteDataContext;
//# sourceMappingURL=dataContextSqlite.js.map