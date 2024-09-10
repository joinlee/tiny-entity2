"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const codeGenerator_1 = require("./codeGenerator");
let apiGenerator = new codeGenerator_1.CodeGenerator({
    outDir: path_1.resolve('./test'),
    modelLoadPath: [
        path_1.resolve('./test/models')
    ],
    modelExportPath: [
        './models'
    ],
    ctxExportPath: '',
    configFilePath: './config',
    outFileName: 'testDataContext.ts',
    databaseType: 'sqlite',
    packageName: '../sqlite/dataContextSqlite'
});
async function GOP() {
    await apiGenerator.generateOpLogFile();
    await apiGenerator.sqlLogToDatabase();
    console.log('gop successful!');
    process.exit(0);
}
async function GDB() {
    apiGenerator.entityToDatabase();
}
GOP();
