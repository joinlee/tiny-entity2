const fs = require('fs');
const path = require("path");
const gulp = require('gulp');

const modelPath = "/test/models";
const databaseType = "mysql";
const outDir = "./";
const outFileName = "testDataContext1.ts";
const configFilePath = "/test/config";

let pjPath = path.resolve();

let modelList = [];

function loadEntityModels() {
    let filePath = pjPath + modelPath;
    fs.readdir(filePath, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }
        for (let file of files) {
            if (file.indexOf(".map") > -1) continue;
            if (file.indexOf(".ts") > -1) continue;
            let model = require(filePath + "/" + file);
            let keys = Object.keys(model);
            let modelClassName = keys[0];
            modelList.push({
                className: modelClassName,
                filePath: filePath + "/" + file.split(".")[0]
            });
        }

        generateCtxFile();

    });
}

function generateCtxFile() {
    let importList = [];
    if (databaseType == "mysql") {
        importList.push('import { MysqlDataContext } from "' + pjPath + '/mysql/dataContextMysql";');
    }
    importList.push('const config = require("' + pjPath + configFilePath + '");');
    for (let item of modelList) {
        importList.push(' import { '+ item.className +' } from '+ item.filePath);
    }

    console.log(importList);
}

gulp.task("gctx", () => {
    loadEntityModels();
})