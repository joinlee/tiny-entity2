import "reflect-metadata";
const tableDefineMetadataKey = Symbol("tableDefine");

export namespace Define {
    export function Table(options?: TableDefineOption): Function;
    export function Table(target: any): void;
    export function Table(opt: TableDefineOption): void | Function {
        let options = Object.assign({}, opt);
        return (constructor: { new(...args: any[]): {} }) => {
            DataDefine.Current.AddMetqdata("TableName", options.TableName, constructor.name);
            return class extends constructor {
                ClassName: () => string;
                TableName: () => string;
                ConverToEntity: <T>(obj: any) => T;
                constructor(...args: any[]) {
                    super(args);
                    for (let key in constructor.prototype) {
                        this[key] = constructor.prototype[key];
                    }
                    this.toString = function () {
                        return options.TableName;
                    }
                    this.TableName = function () {
                        return options.TableName;
                    }
                    this.ClassName = function () {
                        return constructor.name;
                    }
                    this.ConverToEntity = function (obj) {
                        let medateData = DataDefine.Current.GetMetedata(this);
                        for (let item of medateData) {
                            let data = obj[item.ColumnName];
                            if (item.DataType == DataType.Array && !(data instanceof Array) && data) {
                                this[item.ColumnName] = data.split(',');
                            }
                            else if (item.DataType == DataType.JSON && typeof (data) == 'string') {
                                this[item.ColumnName] = JSON.parse(data);
                            }
                            else {
                                this[item.ColumnName] = data;
                            }
                        }

                        let resultObj: any = {};
                        for (let key in this) {
                            if (key === "interpreter" || key === "ctx" || key === "joinEntities") continue;
                            resultObj[key] = this[key];
                        }
                        return resultObj;
                    }
                }
            }
        }
    }

    export function PrimaryKey(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;
            opt.IsPrimaryKey = true;
            opt.NotAllowNULL = true;

            opt = SetPropertyDefineOptionValue(opt);

            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
        };
    }
    export function Column(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;

            opt = SetPropertyDefineOptionValue(opt);

            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
        };
    }

    export function Mapping(opt: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt.ColumnName = propertyName;
            opt.MappingType || (opt.MappingType = MappingType.Many);
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefaultValue(target, propertyName, opt ? opt.DefaultValue : null);
        };
    }

    function SetPropertyDefineOptionValue(opt: PropertyDefineOption) {
        if (opt.DataType === undefined || opt.DataType === null) {
            opt.DataType = DataType.VARCHAR;
        }

        if (opt.DataType === DataType.VARCHAR || opt.DataType === DataType.Array) {
            if (opt.DataLength === undefined || opt.DataLength === null) {
                opt.DataLength = 255;
            }
        }

        if(opt.DataType === DataType.INT){
            if (opt.DataLength === undefined || opt.DataLength === null) {
                opt.DataLength = 10;
            }
        }

        if(opt.DataType === DataType.Decimal){
            if (opt.DataLength === undefined || opt.DataLength === null) {
                opt.DataLength = 10;
                opt.DecimalPoint = 2;
            }
        }

        return opt;
    }

    function SetClassPropertyDefaultValue(target, propertyName, DefaultValue) {
        let propertyValue = null;
        if (DefaultValue) propertyValue = DefaultValue;
        target[propertyName] = propertyValue;
    }

    export enum DataType {
        VARCHAR,
        TEXT,
        LONGTEXT,
        Decimal,
        INT,
        BIGINT,
        BOOL,
        Array,
        JSON
    }

    export class DataDefine {
        static Current: DataDefine = new DataDefine();
        private metadatObjList = [];
        private metadataKeyList = [];
        GetMetedata(entity: any) {
            let tableName = entity.ClassName().toLocaleLowerCase();
            let target = this.GetTargetByTableName(tableName);
            let list: PropertyDefineOption[] = [];
            for (let key in entity) {
                if (typeof (entity[key]) == "function" || key === "interpreter" || key === "ctx" || key === "joinEntities") continue;
                let s = Reflect.getMetadata(tableName + "_metadataKey", target, key);
                if(s) list.push(JSON.parse(s));
            }

            return list;
        }

        AddMetqdata(propertyKey: string, propertyValue: string, tableName?: string) {
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

        private GetTargetByTableName(tableName: string) {
            let item = this.metadatObjList.find(x => x.key == tableName);
            if (item) {
                return item.target;
            }
            else return null;
        }
    }


    export interface PropertyDefineOption extends MappingOption {
        DataType?: DataType;
        DefaultValue?: any;
        NotAllowNULL?: boolean;
        DataLength?: number;
        ColumnName?: string;
        IsPrimaryKey?: boolean;
        ForeignKey?: { ForeignTable: string; ForeignColumn: string; IsPhysics?: boolean; };
        DecimalPoint?: number;
        IsIndex?: boolean;
    }

    interface TableDefineOption {
        TableName: string;
    }

    interface MappingOption {
        Mapping?: string;
        MappingType?: MappingType;
        MappingKey?: { FKey: string, MKey?: string } | string,
    }

    export enum MappingType {
        Many = 0,
        One = 1
    }
}