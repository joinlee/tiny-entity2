"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tableDefineMetadataKey = Symbol("tableDefine");
var Define;
(function (Define) {
    function Table(opt) {
        let options = Object.assign({}, opt);
        return (constructor) => {
            DataDefine.Current.AddMetqdata("TableName", options.TableName, constructor.name);
            return class extends constructor {
                constructor(...args) {
                    super();
                    for (let key in constructor.prototype) {
                        this[key] = constructor.prototype[key];
                    }
                    this.toString = function () {
                        return options.TableName;
                    };
                    this.TableName = function () {
                        return options.TableName;
                    };
                    this.ClassName = function () {
                        return constructor.name;
                    };
                }
            };
        };
    }
    Define.Table = Table;
    function PrimaryKey(opt) {
        return (target, propertyName, propertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;
            opt.IsPrimaryKey = true;
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }
    Define.PrimaryKey = PrimaryKey;
    function Column(opt) {
        return (target, propertyName, propertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;
            if (!opt.DataType) {
                opt.DataType = DataType.VARCHAR;
                opt.DataLength = 255;
            }
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }
    Define.Column = Column;
    function SetClassPropertyDefualtValue(target, propertyName, defualtValue) {
        let propertyValue = null;
        if (defualtValue)
            propertyValue = defualtValue;
        target[propertyName] = propertyValue;
    }
    let DataType;
    (function (DataType) {
        DataType[DataType["VARCHAR"] = 0] = "VARCHAR";
        DataType[DataType["TEXT"] = 1] = "TEXT";
        DataType[DataType["FLOAT"] = 2] = "FLOAT";
        DataType[DataType["INT"] = 3] = "INT";
        DataType[DataType["BOOL"] = 4] = "BOOL";
    })(DataType = Define.DataType || (Define.DataType = {}));
    class DataDefine {
        constructor() {
            this.metadatObjList = [];
            this.metadataKeyList = [];
        }
        GetMetedata(entity) {
            let tableName = entity.ClassName().toLocaleLowerCase();
            let target = this.GetTargetByTableName(tableName);
            let list = [];
            for (let key in entity) {
                if (typeof (entity[key]) == "function" || key === "interpreter" || key === "ctx")
                    continue;
                let s = Reflect.getMetadata(tableName + "_metadataKey", target, key);
                list.push(JSON.parse(s));
            }
            return list;
        }
        AddMetqdata(propertyKey, propertyValue, tableName) {
            if (tableName)
                this.lastTableName = tableName.toLocaleLowerCase();
            tableName = tableName.toLocaleLowerCase();
            let target = this.GetTargetByTableName(tableName);
            if (!target) {
                let t = new Object();
                this.metadatObjList.push({
                    key: tableName,
                    target: t
                });
                target = t;
            }
            Reflect.defineMetadata(tableName + "_metadataKey", propertyValue, target, propertyKey);
        }
        GetTargetByTableName(tableName) {
            let item = this.metadatObjList.find(x => x.key == tableName);
            if (item) {
                return item.target;
            }
            else
                return null;
        }
    }
    DataDefine.Current = new DataDefine();
    Define.DataDefine = DataDefine;
})(Define = exports.Define || (exports.Define = {}));
//# sourceMappingURL=dataDefine.js.map