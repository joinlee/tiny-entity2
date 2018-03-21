const fs = require('fs');
const path = require("path");
const gulp = require('gulp');
const m = require('./codeGenerator');
let g = new m.CodeGenerator({
    outDir: './test',
    modelLoadPath: './test/models',
    modelExportPath: './models',
    ctxExportPath: '../mysql',
    configFilePath: './config',
    outFileName: 'testDataContext.ts',
    databaseType: 'mysql',
    packageName: '../mysql/dataContextMysql'
});

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

gulp.task('gctx', () => {
    g.generateCtxFile();
});
gulp.task('gdb', () => {
    g.entityToDatabase();
});

gulp.task('gop', () => {
    g.generateOpLogFile().then(() => {
        g.sqlLogToDatabase();
    }).catch(err => {
        console.log(err);
    });

});