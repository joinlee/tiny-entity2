"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
gulp.task('gctx', () => __awaiter(void 0, void 0, void 0, function* () {
    apiGenerator.generateCtxFile();
}));
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
gulp.task('gop', () => __awaiter(void 0, void 0, void 0, function* () {
    let index = process.argv.findIndex(x => x == 'gop');
    console.log(process.argv);
    let p = process.argv[index + 1];
    if (!p) {
        p = '-api';
    }
    if (p == '-api') {
        yield apiGenerator.generateOpLogFile();
        yield apiGenerator.sqlLogToDatabase();
    }
    console.log('gop successful!');
    process.exit(0);
}));
