"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class CodeGenerator {
    constructor(options) {
        this.options = options;
        this.modelList = [];
    }
    loadEntityModels(callback) {
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
                let model = require(this.options.modelLoadPath + "/" + file);
                let keys = Object.keys(model);
                let modelClassName = keys[0];
                this.options.modelList.push({
                    className: modelClassName,
                    filePath: this.options.modelExportPath + "/" + file.split(".")[0]
                });
            }
            callback();
        });
    }
    generateCtxFile() {
        this.loadEntityModels(() => {
            let importList = [];
            let baseCtx = "";
            importList.push('const config = require("' + this.options.configFilePath + '");');
            if (this.options.databaseType == "mysql") {
                baseCtx = "MysqlDataContext";
                importList.push('import { ' + baseCtx + ' } from "tiny-entity2"');
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
            context += "\n return true; \n} \n}";
            this.writeFile(context);
        });
    }
    writeFile(data) {
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
        let ctxName = this.options.outFileName.split(".")[0];
        let filePath = this.options.outDir + "/" + ctxName;
        let ctxModule = require(filePath);
        let ctxClassName = Object.keys(ctxModule)[0];
        let newCtxInstance = new ctxModule[ctxClassName];
        newCtxInstance.CreateDatabase().then((r) => {
            console.log("map to database success!");
        }).catch(err => {
            console.log(err);
        });
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=codeGenerator.js.map