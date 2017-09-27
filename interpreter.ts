import { Define } from './define/dataDefine';
import { IJoinChildQueryObject } from './queryObject';
export class Interpreter {
    private escape: any;
    private partOfWhere: string[] = [];
    private partOfSelect: string = "*";
    constructor(escape?) {
        if (escape)
            this.escape = escape;
        else
            this.escape = function (value) { return value; }
    }

    TransToInsertSql(entity: any): string {
        let sqlStr = "INSERT INTO `" + entity.toString() + "`";
        let pt = this.InsertPropertyFormat(entity);
        sqlStr += " (" + pt.PropertyNameList.join(',') + ") VALUES (" + pt.PropertyValueList.join(',') + ");";
        return sqlStr;
    }

    TransToUpdateSql(entity: any): string {
        let sqlStr = "UPDATE `" + entity.toString() + "` SET ";
        let qList = this.UpdatePropertyFormat(entity);

        let primaryKeyObj = this.GetPrimaryKeyObj(entity);
        sqlStr += qList.join(',') + " WHERE " + primaryKeyObj.key + "=" + this.escape(primaryKeyObj.value) + ";";

        return sqlStr;
    }

    private GetPrimaryKeyObj(entity: any) {
        let result: { key: string; value: any } = <any>{};
        for (let item of Define.DataDefine.Current.GetMetedata(entity)) {
            if (item.IsPrimaryKey) {
                result.key = item.ColumnName;
                result.value = entity[item.ColumnName];
            }
        }

        return result;
    }

    TransToDeleteSql(entity: any, func?: any, paramsKey?: any, paramsValue?: any) {
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

    TransToSQLOfWhere(func: Function, tableName?: string, paramsKey?: string[], paramsValue?: any[]): string {
        let param = this.MakeParams(paramsKey, paramsValue);
        // add to sql part of where;
        this.partOfWhere.push("(" + this.TransToSQL(func, tableName, param) + ")");
        return this.TransToSQL(func, tableName, param);
    }

    TransToSQLOfSelect(func: Function, tableName: string) {
        let r = this.TransToSQL(func, tableName);
        // add to sql part of select
        this.partOfSelect = r.split('AND').join(',');
        console.log("rrrrrrrrrrrrrrrr", this.partOfSelect, this.partOfWhere);

        return this.partOfSelect;
    }

    TransToSQLOfJoin(func: Function, foreignTable: any) {
        let foreignTableName = foreignTable.toString().toLocaleLowerCase();
    }

    TransToSQL(func: Function, tableName?: string, param?: any): string {
        let funcStr = func.toString();
        let funcCharList = funcStr.split(" ");
        funcCharList = this.ReplaceParam(funcCharList, param);
        funcCharList = this.GetQueryCharList(funcCharList, tableName);

        return funcCharList.join(" ");
    }

    private ReplaceParam(funcCharList: string[], param): string[] {
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

    private GetQueryCharList(funcCharList: string[], tableName: string): string[] {
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

            if (item === "==") funcCharList[index] = "=";
            if (item === "&&") funcCharList[index] = "AND";
            if (item === "||") funcCharList[index] = "OR";
            if (item.toLocaleLowerCase() == "null") {
                funcCharList[index - 1] = "IS";
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

    private MakeParams(paramsKey: string[], paramsValue: any[]) {
        if (paramsKey && paramsValue) {
            let p: any = {};
            for (let i = 0; i < paramsKey.length; i++) {
                p[paramsKey[i]] = paramsValue[i];
            }
            return p;
        }
        else return null;
    }

    private IsAvailableValue(value): boolean {
        return typeof (value) == "object" || typeof (value) == "string" || typeof (value) == "number" || typeof (value) == "boolean";
    }

    private InsertPropertyFormat(obj: any) {
        const propertyNameList: string[] = [];
        const propertyValueList = [];
        for (var key in obj) {
            //数组转换
            if (this.IsAvailableValue(obj[key])) {
                if (obj[key] == undefined || obj[key] == null || obj[key] === "") continue;
                propertyNameList.push("`" + key + "`");
                if (Array.isArray(obj[key]) || Object.prototype.toString.call(obj[key]) === '[object Object]') {
                    propertyValueList.push(this.escape(JSON.stringify(obj[key])));
                } else if (isNaN(obj[key]) || typeof (obj[key]) == "string") {
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
    private UpdatePropertyFormat(obj: any) {
        let qList = [];
        for (var key in obj) {
            if (key == "sqlTemp" || key == "queryParam" || key == "ctx" || key == "joinParms") continue;
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

    private dateFormat(d: Date, fmt: string) {
        let o = {
            "M+": d.getMonth() + 1, //月份 
            "d+": d.getDate(), //日 
            "H+": d.getHours(), //小时 
            "m+": d.getMinutes(), //分 
            "s+": d.getSeconds(), //秒 
            "q+": Math.floor((d.getMonth() + 3) / 3), //季度 
            "S": d.getMilliseconds() //毫秒 
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

}