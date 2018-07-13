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
                    super(args);
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
                    this.ConverToEntity = function (obj) {
                        let medateData = DataDefine.Current.GetMetedata(this);
                        for (let item of medateData) {
                            let data = obj[item.ColumnName];
                            if (item.DataType == DataType.Array && !(data instanceof Array)) {
                                this[item.ColumnName] = data.split(',');
                            }
                            else if (item.DataType == DataType.JSON && typeof (data) == 'string') {
                                this[item.ColumnName] = JSON.parse(data);
                            }
                            else {
                                this[item.ColumnName] = data;
                            }
                        }
                        let resultObj = {};
                        for (let key in this) {
                            if (key === "interpreter" || key === "ctx" || key === "joinEntities")
                                continue;
                            resultObj[key] = this[key];
                        }
                        return resultObj;
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
            opt.NotAllowNULL = true;
            opt = SetPropertyDefineOptionValue(opt);
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
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
            opt = SetPropertyDefineOptionValue(opt);
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
        };
    }
    Define.Column = Column;
    function Mapping(opt) {
        return (target, propertyName, propertyDescriptor) => {
            opt.ColumnName = propertyName;
            opt.MappingType || (opt.MappingType = MappingType.Many);
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
        };
    }
    Define.Mapping = Mapping;
    function SetPropertyDefineOptionValue(opt) {
        if (!opt.DataType) {
            opt.DataType = DataType.VARCHAR;
            opt.DataLength = 255;
        }
        return opt;
    }
    function SetClassPropertyDefaultValue(target, propertyName, DefaultValue) {
        let propertyValue = null;
        if (DefaultValue)
            propertyValue = DefaultValue;
        target[propertyName] = propertyValue;
    }
    let DataType;
    (function (DataType) {
        DataType[DataType["VARCHAR"] = 0] = "VARCHAR";
        DataType[DataType["TEXT"] = 1] = "TEXT";
        DataType[DataType["Decimal"] = 2] = "Decimal";
        DataType[DataType["INT"] = 3] = "INT";
        DataType[DataType["BIGINT"] = 4] = "BIGINT";
        DataType[DataType["BOOL"] = 5] = "BOOL";
        DataType[DataType["Array"] = 6] = "Array";
        DataType[DataType["JSON"] = 7] = "JSON";
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
                if (typeof (entity[key]) == "function" || key === "interpreter" || key === "ctx" || key === "joinEntities")
                    continue;
                let s = Reflect.getMetadata(tableName + "_metadataKey", target, key);
                list.push(JSON.parse(s));
            }
            return list;
        }
        AddMetqdata(propertyKey, propertyValue, tableName) {
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
    let MappingType;
    (function (MappingType) {
        MappingType[MappingType["Many"] = 0] = "Many";
        MappingType[MappingType["One"] = 1] = "One";
    })(MappingType = Define.MappingType || (Define.MappingType = {}));
})(Define = exports.Define || (exports.Define = {}));
//# sourceMappingURL=dataDefine.js.map