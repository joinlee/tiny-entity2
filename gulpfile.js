const fs = require('fs');
const path = require("path");
const gulp = require('gulp');

const outDir = "./test";

//相对于项目路径
const modelLoadPath = "./test/models";

//相对于outDir路径
const modelExportPath = "./models";

//相对于outDir路径
const ctxExportPath = "../mysql";

//相对于outDir路径
const configFilePath = "../config";

const outFileName = "testDataContext.ts";


const databaseType = "mysql";

let modelList = [];

function loadEntityModels(callback) {
    fs.readdir(modelLoadPath, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }
        for (let file of files) {
            if (file.indexOf(".map") > -1) continue;
            if (file.indexOf(".ts") > -1) continue;
            let model = require(modelLoadPath + "/" + file);
            let keys = Object.keys(model);
            let modelClassName = keys[0];
            modelList.push({
                className: modelClassName,
                filePath: modelExportPath + "/" + file.split(".")[0]
            });
        }

        callback();
    });
}

function generateCtxFile() {
    let importList = [];
    let baseCtx = "";
    importList.push('const config = require("' + configFilePath + '");');
    if (databaseType == "mysql") {
        baseCtx = "MysqlDataContext";
        importList.push('import { ' + baseCtx + ' } from "' + ctxExportPath + '/dataContextMysql";');
    }
    modelList.forEach(item => {
        importList.push('import { ' + item.className + ' } from "' + item.filePath + '"');
    })

    let context = importList.join('\n');
    let fileName = upperFirstLetter(outFileName.split('.')[0]);
    context += "\n export class " + fileName + " extends " + baseCtx + "{\n";

    let tempList = [];
    modelList.forEach(item => {
        tempList.push({
            feild: "private " + lowerFirstLetter(item.className) + ": " + item.className + ";",
            property: "get " + item.className + "() { return this." + lowerFirstLetter(item.className) + "; }",
            constructorMethod: "this." + lowerFirstLetter(item.className) + " = new " + item.className + "(this);",
            createDatabaseMethod: "await super.CreateTable(this." + lowerFirstLetter(item.className) + ");"
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

    return context;
}

function writeFile(data) {
    let filePath = outDir + "/" + outFileName;
    fs.writeFile(filePath, data, function (err) {
        if (err) console.log(err);
    })
}

function lowerFirstLetter(word) {
    let f = word[0];
    return f.toLowerCase() + word.substring(1, word.length);
}

function upperFirstLetter(word) {
    let f = word[0];
    return f.toUpperCase() + word.substring(1, word.length);
}

gulp.task("gctx", () => {
    loadEntityModels(function () {
        let data = generateCtxFile();
        writeFile(data);
    });
})