import fs = require('fs');
import path = require('path');
import { Define } from '.';

// const outDir = "./test";
// //相对于项目路径
// const modelLoadPath = "./test/models";
// //相对于outDir路径
// const modelExportPath = "./models";
// //相对于outDir路径
// const ctxExportPath = "../mysql";
// //相对于outDir路径
// const configFilePath = "./config";
// const outFileName = "testDataContext.ts";
// const databaseType = "mysql";
// let modelList = [];

export interface ICodeGeneratorOptions {
    /**
     * 
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    outDir: string;
    /**
     * 相对于项目路径
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    modelLoadPath: string;
    /**
     * 相对于outDir路径
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    modelExportPath: string;
    /**
     * 相对于outDir路径
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    ctxExportPath: string;
    /**
     * 相对于outDir路径
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    configFilePath: string;
    /**
     * 相对于outDir路径
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    outFileName: string;
    /**
     * 
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    databaseType: string;
    /**
     * 
     * 
     * @type {string}
     * @memberof ICodeGeneratorOptions
     */
    packageName: string;
}

export class CodeGenerator {
    private modelList = [];
    constructor(private options: ICodeGeneratorOptions) {
        if (!options.packageName) this.options.packageName = 'tiny-entity2';
    }
    private loadEntityModels(callback) {
        let that = this;
        fs.readdir(this.options.modelLoadPath, function (err, files) {
            if (err) {
                console.log(err);
                return;
            }
            for (let file of files) {
                if (file.indexOf(".map") > -1) continue;
                if (file.indexOf(".ts") > -1) continue;
                if (file.indexOf("index") > -1) continue;
                let model = require(that.options.modelLoadPath + "/" + file);
                let keys = Object.keys(model);
                let modelClassName = keys[0];
                that.modelList.push({
                    className: modelClassName,
                    filePath: that.options.modelExportPath + "/" + file.split(".")[0]
                });
            }

            callback();
        });
    }
    /**
     * 生成数据上下文Ctx文件
     * 
     * @returns 
     * @memberof CodeGenerator
     */
    generateCtxFile() {
        this.loadEntityModels((() => {
            let importList = [];
            let baseCtx = "";
            importList.push('const config = require("' + this.options.configFilePath + '");');
            if (this.options.databaseType == "mysql") {
                baseCtx = "MysqlDataContext";
                importList.push('import { ' + baseCtx + ' } from "' + this.options.packageName + '"');
            }
            this.modelList.forEach(item => {
                importList.push('import { ' + item.className + ' } from "' + item.filePath + '"');
            })

            let context = importList.join('\n');
            let fileName = this.upperFirstLetter(this.options.outFileName.split('.')[0]);
            context += "\n export class " + fileName + " extends " + baseCtx + "{\n";

            let tempList = [];
            this.modelList.forEach(item => {
                tempList.push({
                    feild: "private " + this.lowerFirstLetter(item.className) + ": " + item.className + ";",
                    property: "get " + item.className + "() { return this." + this.lowerFirstLetter(item.className) + "; }",
                    constructorMethod: "this." + this.lowerFirstLetter(item.className) + " = new " + item.className + "(this);",
                    createDatabaseMethod: "await super.CreateTable(this." + this.lowerFirstLetter(item.className) + ");"
                });
            });

            context += tempList.map(x => x.feild).join('\n');
            context += "\n constructor() { \n super(config);\n";
            context += tempList.map(x => x.constructorMethod).join('\n');
            context += "}\n";
            context += tempList.map(x => x.property).join('\n');
            context += "\n async CreateDatabase() { \n await super.CreateDatabase(); \n";
            context += tempList.map(x => x.createDatabaseMethod).join('\n');
            context += "\n return true; \n} ";

            context += "\nGetEntityObjectList(){\n";
            context += 'return [' + this.modelList.map(item => {
                return "this." + this.lowerFirstLetter(item.className);
            }).join(',') + '];\n}\n}';

            this.writeFile(context);
        }).bind(this));
    }

    private writeFile(data, outFileName?: string) {
        if (outFileName) this.options.outFileName = outFileName;
        let filePath = this.options.outDir + "/" + this.options.outFileName;
        fs.writeFile(filePath, data, function (err) {
            if (err) console.log(err);
        })
    }

    private lowerFirstLetter(word) {
        let f = word[0];
        return f.toLowerCase() + word.substring(1, word.length);
    }

    private upperFirstLetter(word) {
        let f = word[0];
        return f.toUpperCase() + word.substring(1, word.length);
    }

    /**
     * 映射实体到物理数据库 
     * 
     * @memberof CodeGenerator
     */
    entityToDatabase() {
        let newCtxInstance = this.getCtxInstance();
        newCtxInstance.CreateDatabase().then((r) => {
            console.log("map to database success!");
        }).catch(err => {
            console.log(err);
        });
    }

    async generateOpLogFile() {
        let newCtxInstance = this.getCtxInstance();
        let hisStr: any = await this.readFile('oplog.log');
        if (hisStr) {
            let hisData: any[] = JSON.parse(hisStr);
            let r = this.contrastTable(hisData);
            if (r.length > 0) {
                hisData = hisData.concat(r);
            }


        }
        else {
            let oplogList = [];
            for (let item of newCtxInstance.GetEntityObjectList()) {
                let t = newCtxInstance.CreateOperateLog(item);
                oplogList.push({
                    action: 'init',
                    content: t
                });
            }
            this.writeFile(JSON.stringify(oplogList), 'oplog.log');
        }
    }

    private contrastColumn(oldC: Define.PropertyDefineOption[], newC: Define.PropertyDefineOption[]) {
        let diff = [];
        for (let item of newC) {
            let oldItem = oldC.find(x => x.ColumnName == item.ColumnName);
            if (oldItem) {
                let isDiff = false;
                if (oldItem.DataLength != item.DataLength) {
                    isDiff = true;
                }
                else if (oldItem.DataType != item.DataType) {
                    isDiff = true;
                }
                else if (oldItem.DecimalPoint != item.DecimalPoint) { isDiff = true; }
                else if (oldItem.DefualtValue != item.DefualtValue) { isDiff = true; }
                else if (oldItem.IsIndex != item.IsIndex) { isDiff = true; }
                else if (oldItem.NotAllowNULL != item.NotAllowNULL) { isDiff = true; }
                else if (oldItem.DataType != item.DataType) { isDiff = true; }

                if (isDiff) {
                    diff.push(item);
                }
            }
            else {
                diff.push(item);
            }
        }
    }

    private contrastTable(hisData) {
        let newCtxInstance = this.getCtxInstance();
        let currentTableList = newCtxInstance.GetEntityObjectList();

        let diff = [];
        for (let item of hisData) {
            let hasTable = false;

            for (let cItem of currentTableList) {
                let cMeta = newCtxInstance.CreateOperateLog(cItem);
                if (item.content.tableName == cMeta.tableName) {
                    hasTable = true;
                    break;
                }
            }

            if (!hasTable) {
                diff.push({
                    action: 'drop',
                    content: item.content
                });
            }
        }

        for (let cItem of currentTableList) {
            let addCount = 0;
            let dropCount = 0;
            let cMeta = newCtxInstance.CreateOperateLog(cItem);
            for (let item of hisData) {
                if (item.content.tableName == cMeta.tableName) {
                    if (item.action == 'init' || item.action == 'add') {
                        addCount++;
                    }

                    if (item.action == 'drop') {
                        dropCount++;
                    }
                }
            }

            if ((addCount - dropCount) <= 0) {
                diff.push({
                    action: 'add',
                    content: cMeta
                });
            }
        }

        return diff;
    }

    private readFile(outFileName?: string) {
        if (outFileName) this.options.outFileName = outFileName;
        let filePath = this.options.outDir + "/" + this.options.outFileName;
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                else {
                    resolve(data.toString());
                }
            });
        });
    }

    private getCtxInstance() {
        let sp = '/../../';
        if (this.options.packageName) sp = '/';
        let ctxName = this.options.outFileName.split(".")[0];
        let filePath = __dirname + sp + this.options.outDir + "/" + ctxName;
        let ctxModule = require(filePath);
        let ctxClassName = Object.keys(ctxModule)[0];
        return new ctxModule[ctxClassName];
    }
}