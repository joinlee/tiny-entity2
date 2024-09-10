import { resolve } from 'path';
import { CodeGenerator } from './codeGenerator';

let apiGenerator = new CodeGenerator({
    outDir: resolve('./test'),
    modelLoadPath: [
        resolve('./test/models')
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


// GDB();
GOP();