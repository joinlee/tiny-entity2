"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class CodeGenerator {
    constructor(options) {
        this.options = options;
        this.modelList = [];
        if (!options.packageName)
            this.options.packageName = 'tiny-entity2';
    }
    loadEntityModels(callback) {
        let that = this;
        fs.readdir(this.options.modelLoadPath, function (err, files) {
            if (err) {
                console.log(err);
                return;
            }
            for (let file of files) {
                if (file.indexOf(".map") > -1)
                    continue;
                if (file.indexOf(".ts") > -1)
                    continue;
                if (file.indexOf("index") > -1)
                    continue;
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
            });
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
    writeFile(data, outFileName) {
        if (outFileName)
            this.options.outFileName = outFileName;
        let filePath = this.options.outDir + "/" + this.options.outFileName;
        fs.writeFile(filePath, data, function (err) {
            if (err)
                console.log(err);
        });
    }
    lowerFirstLetter(word) {
        let f = word[0];
        return f.toLowerCase() + word.substring(1, word.length);
    }
    upperFirstLetter(word) {
        let f = word[0];
        return f.toUpperCase() + word.substring(1, word.length);
    }
    entityToDatabase() {
        let newCtxInstance = this.getCtxInstance();
        newCtxInstance.CreateDatabase().then((r) => {
            console.log("map to database success!");
        }).catch(err => {
            console.log(err);
        });
    }
    generateOpLogFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let newCtxInstance = this.getCtxInstance();
            let hisStr = yield this.readFile('oplog.log');
            if (hisStr) {
                let hisData = JSON.parse(hisStr);
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
        });
    }
    contrastColumn(oldC, newC) {
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
                else if (oldItem.DecimalPoint != item.DecimalPoint) {
                    isDiff = true;
                }
                else if (oldItem.DefualtValue != item.DefualtValue) {
                    isDiff = true;
                }
                else if (oldItem.IsIndex != item.IsIndex) {
                    isDiff = true;
                }
                else if (oldItem.NotAllowNULL != item.NotAllowNULL) {
                    isDiff = true;
                }
                else if (oldItem.DataType != item.DataType) {
                    isDiff = true;
                }
                if (isDiff) {
                    diff.push(item);
                }
            }
            else {
                diff.push(item);
            }
        }
    }
    contrastTable(hisData) {
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
    readFile(outFileName) {
        if (outFileName)
            this.options.outFileName = outFileName;
        let filePath = this.options.outDir + "/" + this.options.outFileName;
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err)
                    return reject(err);
                else {
                    resolve(data.toString());
                }
            });
        });
    }
    getCtxInstance() {
        let sp = '/../../';
        if (this.options.packageName)
            sp = '/';
        let ctxName = this.options.outFileName.split(".")[0];
        let filePath = __dirname + sp + this.options.outDir + "/" + ctxName;
        let ctxModule = require(filePath);
        let ctxClassName = Object.keys(ctxModule)[0];
        return new ctxModule[ctxClassName];
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=codeGenerator.js.map