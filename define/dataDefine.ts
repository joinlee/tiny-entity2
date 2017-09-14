import "reflect-metadata";
const tableDefineMetadataKey = Symbol("tableDefine");

export namespace Define {
    export function Table(options?: TableDefineOption): Function;
    export function Table(target: any): void;
    export function Table(opt: TableDefineOption): void | Function {
        let options = Object.assign({}, opt);
        // Reflect.defineMetadata(tableDefineMetadataKey, options.TableName, DataDefine.Current, "Table");
        return (constructor: { new(...args: any[]): {} }) => {
            return class extends constructor {
                constructor(...args: any[]) {
                    super();
                    for (let key in constructor.prototype) {
                        this[key] = constructor.prototype[key];
                    }
                    this.toString = function () {
                        return  options.TableName;
                    }
                }
            }
        }
    }

    export function PrimaryKey(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    export function Column(opt?: PropertyDefineOption) {
        return (target: any, propertyName: string, propertyDescriptor?: PropertyDescriptor) => {
            SetClassPropertyDefualtValue(target, propertyName, opt ? opt.DefualtValue : null);
        };
    }

    function SetClassPropertyDefualtValue(target, propertyName, defualtValue) {
        let propertyValue = null;
        if (defualtValue) propertyValue = defualtValue;
        target[propertyName] = propertyValue;
    }

    export enum DataType {
        STRING,
        FLOAT,
        INT,
        BOOL,
        TEXT
    }

    export class DataDefine {
        static Current: DataDefine = new DataDefine();
        GetMetedata() {
            // return Reflect.getMetadataKeys(DataDefine.Current, "Table");
        }
    }


    interface PropertyDefineOption {
        DataType?: DataType;
        DefualtValue?: any;
        NotAllowNULL?: boolean;
        DataLength?: number;
    }

    interface TableDefineOption {
        TableName: string;
    }
}