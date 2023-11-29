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
exports.CodeGenerator = void 0;
const fs = require("fs");
const dataDefine_1 = require("./define/dataDefine");
const transcation_1 = require("./transcation");
const path = require("path");
class CodeGenerator {
    constructor(options) {
        this.options = options;
        this.modelList = [];
        if (!options.packageName)
            this.options.packageName = 'tiny-entity2';
    }
    loadEntityModels() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.options.modelLoadPath.length; i++) {
                let modelPath = this.options.modelLoadPath[i];
                let exportPath = this.options.modelExportPath[i];
                yield this.readModelFile(modelPath, exportPath);
            }
        });
    }
    readModelFile(modelPath, exportPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(modelPath, (err, files) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                for (let file of files) {
                    if (file.indexOf(".map") > -1)
                        continue;
                    if (file.indexOf(".ts") > -1)
                        continue;
                    if (file.indexOf("index") > -1)
                        continue;
                    let model = require(modelPath + "/" + file);
                    let keys = Object.keys(model);
                    let modelClassName = keys[0];
                    this.modelList.push({
                        className: modelClassName,
                        filePath: exportPath + "/" + file.split(".")[0]
                    });
                }
                resolve();
            });
        });
    }
    generateCtxFile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadEntityModels();
            let importList = [];
            let baseCtx = "";
            importList.push(`const config = require("${this.options.configFilePath}");`);
            if (this.options.databaseType == "mysql") {
                baseCtx = "MysqlDataContext";
            }
            else if (this.options.databaseType == "sqlite") {
                baseCtx = "SqliteDataContext";
            }
            else if (this.options.databaseType == 'sqljs') {
                baseCtx = "SqlJSDataContext";
            }
            importList.push(`import { ${baseCtx} } from "${this.options.packageName}"`);
            this.modelList.forEach(item => {
                importList.push(`import { ${item.className} } from "${item.filePath}"`);
            });
            let fileName = this.upperFirstLetter(this.options.outFileName.split('.')[0]);
            let tempList = [];
            this.modelList.forEach(item => {
                tempList.push({
                    feild: "private " + this.lowerFirstLetter(item.className) + ": " + item.className + ";",
                    property: "get " + item.className + "() { return this." + this.lowerFirstLetter(item.className) + "; }",
                    constructorMethod: "this." + this.lowerFirstLetter(item.className) + " = new " + item.className + "(this);",
                    createDatabaseMethod: "await super.CreateTable(this." + this.lowerFirstLetter(item.className) + ");"
                });
            });
            let context = `
            ${importList.join('\n')}
            export class ${fileName} extends ${baseCtx} {
                ${tempList.map(x => x.feild).join('\n')}
                constructor(){
                    super(config);
                    ${tempList.map(x => x.constructorMethod).join('\n')}
                }
                ${tempList.map(x => x.property).join('\n')}
                async CreateDatabase(){
                    await super.CreateDatabase();
                    ${tempList.map(x => x.createDatabaseMethod).join('\n')}
                    return true;
                }

                GetEntityObjectList(){
                    return [${this.modelList.map(item => {
                return "this." + this.lowerFirstLetter(item.className);
            }).join(',')}];
                }
            }
            `;
            this.writeFile(context, this.options.outDir + "/" + this.options.outFileName);
        });
    }
    writeFile(data, fileName) {
        console.log('file patha:', fileName);
        return new Promise((resolve, reject) => {
            fs.writeFile(fileName, data, function (err) {
                if (err)
                    return reject(err);
                else
                    return resolve();
            });
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
        let newCtxInstance = this.getCtxInstance();
        return newCtxInstance.CreateDatabase().then((r) => {
            console.log("map to database success!");
        }).catch(err => {
            console.log(err);
        });
    }
    generateOpLogFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let newCtxInstance = this.getCtxInstance();
                let USER_DIR = process.env.USER_DIR;
                USER_DIR || (USER_DIR = this.options.outDir + '/');
                this.hisStr = yield this.readFile(path.resolve(`${USER_DIR}oplog.log`));
                if (this.hisStr) {
                    let hisData = JSON.parse(this.hisStr);
                    let lastLogItem = hisData[hisData.length - 1];
                    let r = this.contrastTable(lastLogItem.logs);
                    if (r.length > 0) {
                        this.hisStr = JSON.stringify([lastLogItem, { version: Date.now(), logs: r }]);
                    }
                }
                else {
                    let oplogList = [];
                    for (let item of newCtxInstance.GetEntityObjectList()) {
                        let t = newCtxInstance.CreateOperateLog(item);
                        oplogList.push({
                            action: 'init',
                            content: t
                        });
                    }
                    this.hisStr = JSON.stringify([{ version: Date.now(), logs: oplogList }]);
                }
                let sqls = yield this.transLogToSqlList(this.hisStr);
                let sqlStr = yield this.readFile(path.resolve(`${USER_DIR}sqllogs.logq`));
                if (sqls.length > 0) {
                    if (sqlStr) {
                        this.sqlData = JSON.parse(sqlStr);
                        this.sqlData.push({
                            version: Date.now(),
                            sql: sqls
                        });
                    }
                    else {
                        this.sqlData = [{ version: Date.now(), sql: sqls }];
                    }
                }
            }
            catch (error) {
                console.log('generateOpLogFile', error);
            }
        });
    }
    sqlLogToDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let USER_DIR = process.env.USER_DIR;
                USER_DIR || (USER_DIR = this.options.outDir + "/");
                if (this.sqlData) {
                    let lastSql = this.sqlData[this.sqlData.length - 1];
                    if (!lastSql.done) {
                        let newCtxInstance = this.getCtxInstance();
                        console.log(newCtxInstance.ObjectName);
                        yield transcation_1.Transaction(newCtxInstance, (ctx) => __awaiter(this, void 0, void 0, function* () {
                            yield newCtxInstance.Query(lastSql.sql, true);
                        }));
                        console.log('nnnnnnnnnnnnnnnnnn');
                        lastSql.done = true;
                        yield this.writeFile(JSON.stringify(this.sqlData), path.resolve(`${USER_DIR}sqllogs.logq`));
                        yield this.writeFile(this.hisStr, path.resolve(`${USER_DIR}oplog.log`));
                    }
                    this.sqlData = null;
                    this.hisStr = null;
                    return;
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    contrastColumn(oldC, newC) {
        let diff = [];
        for (let item of newC) {
            if (item.Mapping)
                continue;
            let oldItem = oldC.find(x => x.ColumnName.toLocaleLowerCase() == item.ColumnName.toLocaleLowerCase());
            if (oldItem) {
                let isDiff = false;
                let tempColumn = {};
                tempColumn.DataType = item.DataType;
                tempColumn.DataLength = item.DataLength;
                tempColumn.ColumnName = item.ColumnName;
                if (oldItem.DecimalPoint != item.DecimalPoint) {
                    isDiff = true;
                    tempColumn.DecimalPoint = item.DecimalPoint;
                }
                else if (oldItem.DefaultValue != item.DefaultValue) {
                    isDiff = true;
                    tempColumn.DefaultValue = item.DefaultValue;
                }
                else if (oldItem.IsIndex != item.IsIndex) {
                    isDiff = true;
                    tempColumn.IsIndex = item.IsIndex;
                }
                else if (oldItem.NotAllowNULL != item.NotAllowNULL) {
                    isDiff = true;
                    tempColumn.NotAllowNULL = item.NotAllowNULL;
                }
                else if (oldItem.ColumnName != item.ColumnName) {
                    isDiff = true;
                    tempColumn.ColumnName = item.ColumnName;
                }
                if (isDiff) {
                    diff.push({
                        newItem: tempColumn,
                        oldItem: oldItem
                    });
                }
            }
            else {
                diff.push({
                    newItem: item,
                    oldItem: null
                });
            }
        }
        for (let item of oldC) {
            if (item.Mapping)
                continue;
            let newItem = newC.find(x => x.ColumnName.toLocaleLowerCase() == item.ColumnName.toLocaleLowerCase());
            if (!newItem) {
                diff.push({
                    newItem: null,
                    oldItem: item
                });
            }
        }
        return diff;
    }
    contrastTable(hisData) {
        let newCtxInstance = this.getCtxInstance();
        let currentTableList = newCtxInstance.GetEntityObjectList();
        let diff = [];
        for (let item of hisData) {
            let hasTable = false;
            for (let cItem of currentTableList) {
                let cMeta = newCtxInstance.CreateOperateLog(cItem);
                if (item.content.tableName == cMeta.tableName) {
                    hasTable = true;
                    break;
                }
            }
            if (!hasTable) {
                diff.push({
                    action: 'drop',
                    content: item.content
                });
            }
        }
        for (let cItem of currentTableList) {
            let lastHisItem;
            let cMeta = newCtxInstance.CreateOperateLog(cItem);
            for (let hisItem of hisData) {
                if (hisItem.content.tableName == cMeta.tableName) {
                    lastHisItem = hisItem;
                }
            }
            if (lastHisItem) {
                if (lastHisItem.action == 'drop') {
                    diff.push({
                        action: 'add',
                        content: cMeta
                    });
                }
                else {
                    let columnDiffList = this.contrastColumn(lastHisItem.content.column, cMeta.column);
                    if (columnDiffList.length > 0) {
                        diff.push({
                            action: 'alter',
                            content: cMeta,
                            diffContent: {
                                tableName: cItem.TableName(),
                                column: columnDiffList
                            }
                        });
                    }
                    else {
                        diff.push({
                            action: 'noChange',
                            content: lastHisItem.content
                        });
                    }
                }
            }
            else {
                diff.push({
                    action: 'add',
                    content: cMeta
                });
            }
        }
        return diff;
    }
    transLogToSqlList(hisStr) {
        return __awaiter(this, void 0, void 0, function* () {
            let sqls = [];
            let newCtxInstance = this.getCtxInstance();
            let dataBaseType = this.GetDataBaseType(newCtxInstance);
            if (hisStr) {
                let hisData = JSON.parse(hisStr);
                let lastLogItem = hisData[hisData.length - 1];
                for (let logItem of lastLogItem.logs) {
                    let tableList = newCtxInstance.GetEntityObjectList();
                    let table;
                    for (let tableItem of tableList) {
                        if (tableItem.TableName() == logItem.content.tableName) {
                            table = tableItem;
                        }
                    }
                    if (logItem.action == 'init') {
                        sqls.push(newCtxInstance.DeleteTableSql(table));
                        sqls.push(newCtxInstance.CreateTableSql(table));
                    }
                    else if (logItem.action == 'add') {
                        sqls.push(newCtxInstance.CreateTableSql(table));
                    }
                    else if (logItem.action == 'drop') {
                        if (table) {
                            sqls.push(newCtxInstance.DeleteTableSql(table));
                        }
                    }
                    else if (logItem.action == 'alter') {
                        for (let diffItem of logItem.diffContent.column) {
                            if (diffItem.oldItem && !diffItem.newItem) {
                                if (dataBaseType == 'mysql') {
                                    sqls.push('ALTER TABLE `' + logItem.diffContent.tableName + '` DROP `' + diffItem.oldItem.ColumnName + '`;');
                                }
                            }
                            if (!diffItem.oldItem && diffItem.newItem) {
                                let cqls = this.getColumnsSqlList(diffItem, 'add', logItem.diffContent.tableName);
                                let columnDefineList = cqls.columnDefineList;
                                sqls.push('ALTER TABLE `' + logItem.diffContent.tableName + '` ADD `' + diffItem.newItem.ColumnName + '` ' + columnDefineList.join(' ') + ';');
                                if (cqls.indexSqlList.length > 0) {
                                    sqls = sqls.concat(cqls.indexSqlList);
                                }
                            }
                            if (diffItem.oldItem && diffItem.newItem) {
                                let cqls = this.getColumnsSqlList(diffItem, 'alter', logItem.diffContent.tableName);
                                let columnDefineList = cqls.columnDefineList;
                                if (columnDefineList.length > 0 || diffItem.oldItem.ColumnName != diffItem.newItem.ColumnName) {
                                    sqls.push(`ALTER TABLE \`${logItem.diffContent.tableName}\` CHANGE \`${diffItem.oldItem.ColumnName}\` \`${diffItem.newItem.ColumnName}\` ${columnDefineList.join(' ')};`);
                                }
                                if (cqls.indexSqlList.length > 0) {
                                    sqls = sqls.concat(cqls.indexSqlList);
                                }
                            }
                        }
                    }
                }
            }
            console.log(sqls);
            return sqls;
        });
    }
    GetDataBaseType(newCtxInstance) {
        let dataBaseType = '';
        if (newCtxInstance.ObjectName == 'SqliteDataContext') {
            dataBaseType = 'sqlite';
        }
        else if (newCtxInstance.ObjectName == 'MysqlDataContext') {
            dataBaseType = 'mysql';
        }
        return dataBaseType;
    }
    getColumnsSqlList(diffItem, action, tableName) {
        let newCtxInstance = this.getCtxInstance();
        let dataBaseType = this.GetDataBaseType(newCtxInstance);
        let indexSqlList = [];
        let columnDefineList = [];
        let c = diffItem.newItem;
        let lengthStr = '';
        if (c.DataLength != undefined) {
            let dcp = c.DecimalPoint != undefined ? "," + c.DecimalPoint : "";
            lengthStr = "(" + c.DataLength + dcp + ")";
        }
        if (c.DataType == dataDefine_1.Define.DataType.JSON) {
            c.DataType = dataDefine_1.Define.DataType.TEXT;
        }
        if (diffItem.oldItem.DataType != diffItem.newItem.DataType) {
            columnDefineList.push(dataDefine_1.Define.DataType[c.DataType] + lengthStr);
        }
        if (dataBaseType == 'mysql') {
            columnDefineList.push(c.NotAllowNULL ? 'NOT NULL' : 'NULL');
        }
        let valueStr = '';
        if (c.DefaultValue != undefined) {
            if (c.DataType >= 0 && c.DataType <= 1) {
                valueStr = "DEFAULT '" + c.DefaultValue + "'";
            }
            else {
                valueStr = "DEFAULT " + c.DefaultValue;
            }
        }
        if (valueStr) {
            columnDefineList.push(valueStr);
        }
        if (action == 'add') {
            if (c.IsIndex) {
                if (dataBaseType == 'mysql') {
                    columnDefineList.push(', Add INDEX `idx_' + c.ColumnName + '` (`' + c.ColumnName + '`) USING BTREE');
                }
                else if (dataBaseType == "sqlite") {
                    indexSqlList.push(`CREATE INDEX idx_${c.ColumnName}_${tableName} ON ${tableName} (${c.ColumnName});`);
                }
            }
        }
        else if (action == 'alter') {
            if (c.IsIndex) {
                let indexSql = '';
                if (diffItem.oldItem && diffItem.oldItem.IsIndex) {
                    if (dataBaseType == 'mysql') {
                        indexSql = ',DROP INDEX `idx_' + diffItem.oldItem.ColumnName;
                    }
                    else if (dataBaseType == 'sqlite') {
                        indexSqlList.push(`DROP INDEX idx_${diffItem.oldItem.ColumnName}_${tableName};`);
                    }
                }
                if (dataBaseType == 'mysql') {
                    indexSql += ', ADD INDEX `idx_' + c.ColumnName + '` (`' + c.ColumnName + '`) USING BTREE';
                    columnDefineList.push(indexSql);
                }
                else if (dataBaseType == 'sqlite') {
                    indexSqlList.push(`CREATE INDEX idx_${c.ColumnName}_${tableName} ON ${tableName} (${c.ColumnName});`);
                }
            }
            else {
                if (diffItem.oldItem && diffItem.oldItem.IsIndex) {
                    if (dataBaseType == 'mysql') {
                        columnDefineList.push(',DROP INDEX `idx_' + diffItem.oldItem.ColumnName + '`');
                    }
                    else if (dataBaseType == 'sqlite') {
                        indexSqlList.push(`DROP INDEX idx_${diffItem.oldItem.ColumnName}_${tableName};`);
                    }
                }
            }
        }
        return {
            columnDefineList,
            indexSqlList,
        };
    }
    readFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    if (err.errno == -4058 || err.errno == -2) {
                        return resolve('');
                    }
                    return reject(err);
                }
                else {
                    return resolve(data.toString());
                }
            });
        });
    }
    getCtxInstance() {
        let ctxName = this.options.outFileName.split(".")[0];
        let filePath = this.options.outDir + "/" + ctxName;
        let ctxModule = require(filePath);
        let ctxClassName = Object.keys(ctxModule)[0];
        return new ctxModule[ctxClassName];
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=codeGenerator.js.map