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
                getFuncName: () => string;
                constructor(...args: any[]) {
                    super();
                    for (let key in constructor.prototype) {
                        this[key] = constructor.prototype[key];
                    }
                    this.toString = function () {
                        return options.TableName;
                    }
                    this.getFuncName = function(){
                        return constructor.name;
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
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    export function Column(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            opt || (opt = {});
            opt.ColumnName = propertyName;
            DataDefine.Current.AddMetqdata(propertyName, JSON.stringify(opt), target.constructor.name);
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    function SetClassPropertyDefualtValue(target, propertyName, defualtValue) {
        let propertyValue = null;
        if (defualtValue) propertyValue = defualtValue;
        target[propertyName] = propertyValue;
    }

    export enum DataType {
        VARCHAR,
        FLOAT,
        INT,
        BOOL,
        TEXT
    }

    export class DataDefine {
        static Current: DataDefine = new DataDefine();
        private metadatObjList = [];
        private metadataKeyList = [];
        private lastTableName: string;
        GetMetedata(entity: any) {
            let tableName = entity.getFuncName().toLocaleLowerCase();
            let target = this.GetTargetByTableName(tableName);
            let list: PropertyDefineOption[] = [];
            for (let key in entity) {
                if(typeof(entity[key]) == "function" || key === "interpreter") continue;
                let s = Reflect.getMetadata(tableName + "_metadataKey", target, key);
                list.push(JSON.parse(s));
            }

            return list;
        }

        AddMetqdata(propertyKey: string, propertyValue: string, tableName?: string) {
            if (tableName) this.lastTableName = tableName.toLocaleLowerCase();
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


   interface PropertyDefineOption {
        DataType?: DataType;
        DefualtValue?: any;
        NotAllowNULL?: boolean;
        DataLength?: number;
        ColumnName?: string;
        IsPrimaryKey?: boolean;
    }

    interface TableDefineOption {
        TableName: string;
    }
}