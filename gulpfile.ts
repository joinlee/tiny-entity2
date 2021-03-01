// const fs = require('fs');
// const path = require("path");
// const gulp = require('gulp');
// const m = require('./codeGenerator');
// let g = new m.CodeGenerator({
//     outDir: './test',
//     modelLoadPath: './test/models',
//     modelExportPath: './models',
//     ctxExportPath: '../mysql',
//     configFilePath: './config',
//     outFileName: 'testDataContext.ts',
//     databaseType: 'mysql',
//     packageName: '../mysql/dataContextMysql'
// });

// // const outDir = "./test";

// // //相对于项目路径
// // const modelLoadPath = "./test/models";

// // //相对于outDir路径
// // const modelExportPath = "./models";

// // //相对于outDir路径
// // const ctxExportPath = "../mysql";

// // //相对于outDir路径
// // const configFilePath = "./config";

// // const outFileName = "testDataContext.ts";

// // const databaseType = "mysql";

// gulp.task('gctx', () => {
//     g.generateCtxFile();
// });
// gulp.task('gdb', () => {
//     g.entityToDatabase();
// });

// gulp.task('gop', () => {
//     g.generateOpLogFile().then(() => {
//         g.sqlLogToDatabase().then(()=>{
//             console.log('gop sucessful!');
//         });
//     }).catch(err => {
//         console.log(err);
//     });

// });


const gulp = require('gulp');
import * as fs from 'fs';
import * as path from 'path';
import { CodeGenerator } from '.';
process.env.tinyLog = 'on';

let apiGenerator = new CodeGenerator({
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
})

gulp.task('gdb', () => {
    let index = process.argv.findIndex(x => x == 'gdb');
    let p = process.argv[index + 1];
    if (!p) {
        p = '-api';
    }
    if (p == '-api') {
        apiGenerator.entityToDatabase();
    }
})

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
});
