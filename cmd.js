#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = require("path");
const codeGenerator_1 = require("./codeGenerator");
commander_1.program
    .option('-c,--gctx [type]', 'generate data context')
    .option('-d,--gdb [type]', 'generate database')
    .option('-o,--gop [type]', 'generate operation logs');
commander_1.program.parse(process.argv);
const options = commander_1.program.opts();
if (options.gctx) {
    console.log('gctx command!', options.gctx);
    const codeGenerator = getGeneratorInstance(options.gctx);
    codeGenerator.generateCtxFile().then(() => {
        console.log('gctx excute sucessful!');
    }).catch(error => {
        console.error(error);
    });
}
else if (options.gdb) {
    console.log('gdb command!', options.gdb);
    const codeGenerator = getGeneratorInstance(options.gdb);
    codeGenerator.entityToDatabase().then(() => {
        console.log('gdb excute sucessful!');
        process.exit(0);
    }).catch(error => {
        console.error(error);
    });
}
else if (options.gop) {
    const codeGenerator = getGeneratorInstance(options.gop);
    codeGenerator.generateOpLogFile().then(() => {
        codeGenerator.sqlLogToDatabase().then(() => {
            console.log('gop excute sucessful!');
        }).catch(error => {
            console.error('sqlLogToDatabase', error);
        });
    }).catch(error => {
        console.error('generateOpLogFile', error);
    });
}
function getGeneratorInstance(tinyconfigFilePath) {
    const tinyconfig = require(path.resolve(tinyconfigFilePath));
    const codeGen = new codeGenerator_1.CodeGenerator({
        outDir: path.resolve(tinyconfig.outDir),
        modelLoadPath: tinyconfig.modelLoadPath.map(x => path.resolve(x)),
        modelExportPath: tinyconfig.modelExportPath,
        ctxExportPath: tinyconfig.ctxExportPath,
        configFilePath: tinyconfig.configFilePath,
        outFileName: tinyconfig.outFileName,
        databaseType: tinyconfig.databaseType,
        packageName: tinyconfig.packageName
    });
    return codeGen;
}
//# sourceMappingURL=cmd.js.map