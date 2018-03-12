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
                            this[item.ColumnName] = obj[item.ColumnName];
                        }

                        let resultObj: any = {};
                        for (let key in this) {
                            //|| key === "ConverToEntity"
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
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }
    export function Column(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;
            if (!opt.DataType) {
                opt.DataType = DataType.VARCHAR;
                opt.DataLength = 255;
            }
            opt = SetPropertyDefineOptionValue(opt);

            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    export function Mapping(opt: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt.ColumnName = propertyName;
            opt.MappingType || (opt.MappingType = MappingType.Many);
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    function SetPropertyDefineOptionValue(opt: PropertyDefineOption) {
        if (!opt.DataType) {
            opt.DataType = DataType.VARCHAR;
            opt.DataLength = 255;
        }

        return opt;
    }

    function SetClassPropertyDefualtValue(target, propertyName, defualtValue) {
        let propertyValue = null;
        if (defualtValue) propertyValue = defualtValue;
        target[propertyName] = propertyValue;
    }

    export enum DataType {
        VARCHAR,
        TEXT,
        Decimal,
        INT,
        BIGINT,
        BOOL,
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
                list.push(JSON.parse(s));
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
        DefualtValue?: any;
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
        MappingKey?: string
    }

    export enum MappingType {
        Many = 0,
        One = 1
    }
}