"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const dataDefine_1 = require("./define/dataDefine");
const transcation_1 = require("./transcation");
class CodeGenerator {
    constructor(options) {
        this.options = options;
        this.modelList = [];
        if (!options.packageName)
            this.options.packageName = 'tiny-entity2';
    }
    loadEntityModels(callback) {
        let that = this;
        fs.readdir(this.options.modelLoadPath, function (err, files) {
            if (err) {
                console.log(err);
                return;
            }
            for (let file of files) {
                if (file.indexOf(".map") > -1)
                    continue;
                if (file.indexOf(".ts") > -1)
                    continue;
                if (file.indexOf("index") > -1)
                    continue;
                let model = require(that.options.modelLoadPath + "/" + file);
                let keys = Object.keys(model);
                let modelClassName = keys[0];
                that.modelList.push({
                    className: modelClassName,
                    filePath: that.options.modelExportPath + "/" + file.split(".")[0]
                });
            }
            callback();
        });
    }
    generateCtxFile() {
        this.loadEntityModels((() => {
            let importList = [];
            let baseCtx = "";
            importList.push(`const config = require("${this.options.configFilePath}");`);
            if (this.options.databaseType == "mysql") {
                baseCtx = "MysqlDataContext";
                importList.push(`import { ${baseCtx} } from "${this.options.packageName}"`);
            }
            else if (this.options.databaseType == "sqlite") {
                baseCtx = "SqliteDataContext";
                importList.push(`import { ${baseCtx} } from "${this.options.packageName}"`);
            }
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
            this.writeFile(context);
        }).bind(this));
    }
    writeFile(data, outFileName) {
        let outfileName = this.options.outFileName;
        if (outFileName)
            outfileName = outFileName;
        let filePath = this.options.outDir + "/" + outfileName;
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, function (err) {
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
        newCtxInstance.CreateDatabase().then((r) => {
            console.log("map to database success!");
        }).catch(err => {
            console.log(err);
        });
    }
    generateOpLogFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let newCtxInstance = this.getCtxInstance();
                this.hisStr = yield this.readFile('oplog.log');
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
                let sqlStr = yield this.readFile('sqllogs.logq');
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
                if (this.sqlData) {
                    let lastSql = this.sqlData[this.sqlData.length - 1];
                    if (!lastSql.done) {
                        let newCtxInstance = this.getCtxInstance();
                        yield transcation_1.Transaction(newCtxInstance, (ctx) => __awaiter(this, void 0, void 0, function* () {
                            for (let query of lastSql.sql) {
                                yield newCtxInstance.Query(query);
                            }
                        }));
                        lastSql.done = true;
                        yield this.writeFile(JSON.stringify(this.sqlData), 'sqllogs.logq');
                        yield this.writeFile(this.hisStr, 'oplog.log');
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
            let has = false;
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
                        sqls.push(newCtxInstance.DeleteTableSql(table));
                    }
                    else if (logItem.action == 'alter') {
                        for (let diffItem of logItem.diffContent.column) {
                            if (diffItem.oldItem && !diffItem.newItem) {
                                sqls.push('ALTER TABLE `' + logItem.diffContent.tableName + '` DROP `' + diffItem.oldItem.ColumnName + '`;');
                            }
                            if (!diffItem.oldItem && diffItem.newItem) {
                                let columnDefineList = this.getColumnsSqlList(diffItem, 'add');
                                sqls.push('ALTER TABLE `' + logItem.diffContent.tableName + '` ADD `' + diffItem.newItem.ColumnName + '` ' + columnDefineList.join(' ') + ';');
                            }
                            if (diffItem.oldItem && diffItem.newItem) {
                                let columnDefineList = this.getColumnsSqlList(diffItem, 'alter');
                                let clName = diffItem.newItem.ColumnName;
                                if (!clName) {
                                    clName = diffItem.oldItem.ColumnName;
                                }
                                sqls.push(`ALTER TABLE \`${logItem.diffContent.tableName}\` CHANGE \`${diffItem.oldItem.ColumnName}\` \`${clName}\` ${columnDefineList.join(' ')};`);
                            }
                        }
                    }
                }
            }
            console.log(sqls);
            return sqls;
        });
    }
    getColumnsSqlList(diffItem, action) {
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
        columnDefineList.push(dataDefine_1.Define.DataType[c.DataType] + lengthStr);
        columnDefineList.push(c.NotAllowNULL ? 'NOT NULL' : 'NULL');
        let valueStr = '';
        if (c.DefaultValue != undefined) {
            if (c.DataType >= 0 && c.DataType <= 1) {
                valueStr = "DEFAULT '" + c.DefaultValue + "'";
            }
            else {
                valueStr = "DEFAULT " + c.DefaultValue;
            }
        }
        columnDefineList.push(valueStr);
        if (action == 'add') {
            if (c.IsIndex) {
                columnDefineList.push(', Add INDEX `idx_' + c.ColumnName + '` (`' + c.ColumnName + '`) USING BTREE');
            }
        }
        else if (action == 'alter') {
            if (c.IsIndex) {
                let indexSql = '';
                if (diffItem.oldItem && !diffItem.oldItem.IsIndex) {
                    indexSql = ',DROP INDEX `idx_' + diffItem.oldItem.ColumnName + '`,';
                }
                indexSql += 'ADD INDEX `idx_' + c.ColumnName + '` (`' + c.ColumnName + '`) USING BTREE';
                columnDefineList.push(indexSql);
            }
            else {
                if (diffItem.oldItem && !diffItem.oldItem.IsIndex) {
                    columnDefineList.push(',DROP INDEX `idx_' + diffItem.oldItem.ColumnName + '`');
                }
            }
        }
        return columnDefineList;
    }
    readFile(outFileName) {
        let filePath = this.options.outDir + "/" + outFileName;
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    if (err.errno == -4058 || err.errno == -2) {
                        return resolve();
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
        let sp = '/../../';
        if (this.options.packageName != 'tiny-entity2')
            sp = '/';
        let ctxName = this.options.outFileName.split(".")[0];
        let filePath = __dirname + sp + this.options.outDir + "/" + ctxName;
        let ctxModule = require(filePath);
        let ctxClassName = Object.keys(ctxModule)[0];
        return new ctxModule[ctxClassName];
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=codeGenerator.js.map