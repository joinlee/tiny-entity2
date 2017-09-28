"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataDefine_1 = require("./define/dataDefine");
class Interpreter {
    constructor(escape) {
        this.partOfWhere = [];
        this.partOfSelect = "*";
        this.partOfJoin = [];
        if (escape)
            this.escape = escape;
        else
            this.escape = function (value) { return value; };
    }
    GetFinalSql(tableName) {
        let sqlCharts = [];
        sqlCharts.push("SELECT");
        sqlCharts.push(this.partOfSelect);
        sqlCharts.push("FROM");
        sqlCharts.push("`" + tableName + "`");
        for (let joinSql of this.partOfJoin) {
            sqlCharts.push(joinSql);
        }
        if (this.partOfWhere.length > 0) {
            sqlCharts.push("WHERE");
            sqlCharts.push(this.partOfWhere.join(" AND "));
        }
        sqlCharts.push(";");
        return sqlCharts.join(" ");
    }
    TransToInsertSql(entity) {
        let sqlStr = "INSERT INTO `" + entity.toString() + "`";
        let pt = this.InsertPropertyFormat(entity);
        sqlStr += " (" + pt.PropertyNameList.join(',') + ") VALUES (" + pt.PropertyValueList.join(',') + ");";
        return sqlStr;
    }
    TransToUpdateSql(entity) {
        let sqlStr = "UPDATE `" + entity.toString() + "` SET ";
        let qList = this.UpdatePropertyFormat(entity);
        let primaryKeyObj = this.GetPrimaryKeyObj(entity);
        sqlStr += qList.join(',') + " WHERE " + primaryKeyObj.key + "=" + this.escape(primaryKeyObj.value) + ";";
        return sqlStr;
    }
    TransToDeleteSql(entity, func, paramsKey, paramsValue) {
        let sqlStr = "";
        if (func) {
            let s = this.TransToSQLOfWhere(func, entity.toString(), paramsKey, paramsValue);
            sqlStr = "DELETE FROM " + entity.toString() + " WHERE " + s + ";";
        }
        else {
            let primaryKeyObj = this.GetPrimaryKeyObj(entity);
            sqlStr = "DELETE FROM " + entity.toString() + " WHERE " + primaryKeyObj.key + "='" + primaryKeyObj.value + "';";
        }
        return sqlStr;
    }
    TransToSQLOfWhere(func, tableName, paramsKey, paramsValue) {
        let param = this.MakeParams(paramsKey, paramsValue);
        this.partOfWhere.push("(" + this.TransToSQL(func, tableName, param) + ")");
        return this.TransToSQL(func, tableName, param);
    }
    TransToSQLOfSelect(p1, p2) {
        if (arguments.length == 1) {
            this.partOfSelect = this.GetSelectFieldList(p1).join(",");
        }
        else if (arguments.length == 2) {
            let r = this.TransToSQL(p1, p2);
            this.partOfSelect = r.split('AND').join(',');
        }
        return this.partOfSelect;
    }
    TransToSQLOfJoin(fEntity) {
        if (this.partOfSelect === "*") {
            this.partOfSelect = this.GetSelectFieldList(fEntity).join(",");
        }
        else {
            this.partOfSelect += ",";
            this.partOfSelect += this.GetSelectFieldList(fEntity).join(",");
        }
        this.joinTeamp = {
            fTableName: fEntity.toString(),
        };
    }
    TransToSQLOfOn(func, mTableName) {
        if (!this.joinTeamp)
            throw new Error("must use TransToSQLJoin() before!");
        let fTableName = this.joinTeamp.fTableName;
        let funcStr = func.toString();
        let fe = funcStr.substr(0, funcStr.indexOf("=>")).trim();
        funcStr = funcStr.replace(new RegExp(fe, "gm"), "");
        fe = fe.replace(/\(/g, "");
        fe = fe.replace(/\)/g, "");
        let felist = fe.split(",");
        let m = felist[0].trim();
        let f = felist[1].trim();
        let funcCharList = funcStr.split(" ");
        funcCharList[0] = "";
        funcCharList[1] = "";
        for (let i = 2; i < funcCharList.length; i++) {
            if (funcCharList[i].indexOf(m + ".") > -1) {
                funcCharList[i] = funcCharList[i].replace(new RegExp(m + "\\.", "gm"), "`" + mTableName.toLocaleLowerCase() + "`.");
            }
            if (funcCharList[i].indexOf(f + ".") > -1) {
                funcCharList[i] = funcCharList[i].replace(new RegExp(f + "\\.", "gm"), "`" + fTableName.toLocaleLowerCase() + "`.");
            }
            if (funcCharList[i] === "==")
                funcCharList[i] = " = ";
        }
        let sql = "LEFT JOIN `" + fTableName + "` ON " + funcCharList.join("");
        this.partOfJoin.push(sql);
        return this.partOfJoin;
    }
    TransToSQL(func, tableName, param) {
        let funcStr = func.toString();
        let funcCharList = funcStr.split(" ");
        funcCharList = this.ReplaceParam(funcCharList, param);
        funcCharList = this.GetQueryCharList(funcCharList, tableName);
        return funcCharList.join(" ");
    }
    ReplaceParam(funcCharList, param) {
        if (param) {
            for (let key in param) {
                let index = funcCharList.findIndex(x => x.indexOf(key) > -1 && x.indexOf("." + key) <= -1);
                if (index) {
                    funcCharList[index] = funcCharList[index].replace(new RegExp(key, "gm"), this.escape(param[key]));
                }
            }
        }
        return funcCharList;
    }
    GetQueryCharList(funcCharList, tableName) {
        let fChar = funcCharList[0];
        if (tableName)
            tableName = tableName.toLocaleLowerCase();
        for (let index = 0; index < funcCharList.length; index++) {
            let item = funcCharList[index];
            if (item.indexOf(fChar + ".") > -1) {
                if (tableName)
                    funcCharList[index] = funcCharList[index].replace(new RegExp(fChar + "\\.", "gm"), "`" + tableName + "`.");
                else
                    funcCharList[index] = funcCharList[index].replace(new RegExp(fChar + "\\.", "gm"), "");
            }
            if (item === "==")
                funcCharList[index] = "=";
            if (item === "&&")
                funcCharList[index] = "AND";
            if (item === "||")
                funcCharList[index] = "OR";
            if (item.toLocaleLowerCase() == "null") {
                if (funcCharList[index - 1] === "==")
                    funcCharList[index - 1] = "IS";
                else if (funcCharList[index - 1] === "!=")
                    funcCharList[index - 1] = "IS NOT";
                funcCharList[index] = "NULL";
            }
            if (item.indexOf(".IndexOf") > -1) {
                funcCharList[index] = funcCharList[index].replace(new RegExp("\\.IndexOf", "gm"), " LIKE ");
                funcCharList[index] = funcCharList[index].replace(/\(\"/g, '"%');
                funcCharList[index] = funcCharList[index].replace(/\"\)/g, '%"');
                funcCharList[index] = funcCharList[index].replace(/\(\'/g, '"%');
                funcCharList[index] = funcCharList[index].replace(/\'\)/g, '%"');
            }
        }
        funcCharList.splice(0, 1);
        funcCharList.splice(0, 1);
        return funcCharList;
    }
    MakeParams(paramsKey, paramsValue) {
        if (paramsKey && paramsValue) {
            let p = {};
            for (let i = 0; i < paramsKey.length; i++) {
                p[paramsKey[i]] = paramsValue[i];
            }
            return p;
        }
        else
            return null;
    }
    IsAvailableValue(value) {
        return typeof (value) == "object" || typeof (value) == "string" || typeof (value) == "number" || typeof (value) == "boolean";
    }
    InsertPropertyFormat(obj) {
        const propertyNameList = [];
        const propertyValueList = [];
        for (var key in obj) {
            if (this.IsAvailableValue(obj[key])) {
                if (obj[key] == undefined || obj[key] == null || obj[key] === "")
                    continue;
                propertyNameList.push("`" + key + "`");
                if (Array.isArray(obj[key]) || Object.prototype.toString.call(obj[key]) === '[object Object]') {
                    propertyValueList.push(this.escape(JSON.stringify(obj[key])));
                }
                else if (isNaN(obj[key]) || typeof (obj[key]) == "string") {
                    propertyValueList.push(this.escape(obj[key]));
                }
                else if (obj[key] instanceof Date) {
                    propertyValueList.push(this.escape(this.dateFormat(obj[key], "yyyy-MM-dd HH:mm:ss")));
                }
                else {
                    propertyValueList.push(this.escape(obj[key]));
                }
            }
        }
        return { PropertyNameList: propertyNameList, PropertyValueList: propertyValueList };
    }
    UpdatePropertyFormat(obj) {
        let qList = [];
        for (var key in obj) {
            if (key == "sqlTemp" || key == "queryParam" || key == "ctx" || key == "joinParms")
                continue;
            if (this.IsAvailableValue(obj[key]) && key != "id") {
                if (obj[key] == undefined || obj[key] == null || obj[key] === "") {
                    qList.push("`" + key + "`=NULL");
                }
                else if (Array.isArray(obj[key]) || Object.prototype.toString.call(obj[key]) === '[object Object]') {
                    qList.push("`" + key + "`=" + this.escape(JSON.stringify(obj[key])));
                }
                else if (isNaN(obj[key]) || typeof (obj[key]) == "string") {
                    qList.push("`" + key + "`=" + this.escape(obj[key]));
                }
                else if (obj[key] instanceof Date) {
                    qList.push("`" + key + "`=" + this.escape(this.dateFormat(obj[key], "yyyy-MM-dd HH:mm:ss")));
                }
                else {
                    qList.push("`" + key + "`=" + this.escape(obj[key]));
                }
            }
        }
        return qList;
    }
    dateFormat(d, fmt) {
        let o = {
            "M+": d.getMonth() + 1,
            "d+": d.getDate(),
            "H+": d.getHours(),
            "m+": d.getMinutes(),
            "s+": d.getSeconds(),
            "q+": Math.floor((d.getMonth() + 3) / 3),
            "S": d.getMilliseconds()
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    GetPrimaryKeyObj(entity) {
        let result = {};
        for (let item of dataDefine_1.Define.DataDefine.Current.GetMetedata(entity)) {
            if (item.IsPrimaryKey) {
                result.key = item.ColumnName;
                result.value = entity[item.ColumnName];
            }
        }
        return result;
    }
    GetSelectFieldList(entity) {
        let feildList = [];
        let tableName = entity.toString();
        let pList = dataDefine_1.Define.DataDefine.Current.GetMetedata(entity);
        for (let p of pList) {
            feildList.push(tableName + ".`" + p.ColumnName + "` AS " + tableName + "_" + p.ColumnName);
        }
        return feildList;
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=interpreter.js.map