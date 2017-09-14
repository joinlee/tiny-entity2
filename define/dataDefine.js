"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tableDefineMetadataKey = Symbol("tableDefine");
var Define;
(function (Define) {
    function Table(opt) {
        let options = Object.assign({}, opt);
        return (constructor) => {
            return class extends constructor {
                constructor(...args) {
                    super();
                    for (let key in constructor.prototype) {
                        this[key] = constructor.prototype[key];
                    }
                    this.toString = function () {
                        return options.TableName;
                    };
                }
            };
        };
    }
    Define.Table = Table;
    function PrimaryKey(opt) {
        return (target, propertyName, propertyDescriptor) => {
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }
    Define.PrimaryKey = PrimaryKey;
    function Column(opt) {
        return (target, propertyName, propertyDescriptor) => {
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
        DataType[DataType["STRING"] = 0] = "STRING";
        DataType[DataType["FLOAT"] = 1] = "FLOAT";
        DataType[DataType["INT"] = 2] = "INT";
        DataType[DataType["BOOL"] = 3] = "BOOL";
        DataType[DataType["TEXT"] = 4] = "TEXT";
    })(DataType = Define.DataType || (Define.DataType = {}));
    class DataDefine {
        GetMetedata() {
        }
    }
    DataDefine.Current = new DataDefine();
    Define.DataDefine = DataDefine;
})(Define = exports.Define || (exports.Define = {}));
//# sourceMappingURL=dataDefine.js.map