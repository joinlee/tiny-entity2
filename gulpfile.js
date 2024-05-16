"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp = require('gulp');
const path = require("path");
const _1 = require(".");
process.env.tinyLog = 'on';
let apiGenerator = new _1.CodeGenerator({
    outDir: path.resolve('./test'),
    modelLoadPath: [
        path.resolve('./test/models')
    ],
    modelExportPath: [
        './models'
    ],
    ctxExportPath: '',
    configFilePath: './config',
    outFileName: 'testDataContext.ts',
    databaseType: 'mysql',
    packageName: '../mysql/dataContextMysql'
});
gulp.task('gctx', async () => {
    apiGenerator.generateCtxFile();
});
gulp.task('gdb', () => {
    let index = process.argv.findIndex(x => x == 'gdb');
    let p = process.argv[index + 1];
    if (!p) {
        p = '-api';
    }
    if (p == '-api') {
        apiGenerator.entityToDatabase();
    }
});
gulp.task('gop', async () => {
    let index = process.argv.findIndex(x => x == 'gop');
    console.log(process.argv);
    let p = process.argv[index + 1];
    if (!p) {
        p = '-api';
    }
    if (p == '-api') {
        await apiGenerator.generateOpLogFile();
        await apiGenerator.sqlLogToDatabase();
    }
    console.log('gop successful!');
    process.exit(0);
}));
