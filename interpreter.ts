import { Define } from './define/dataDefine';
import { IJoinChildQueryObject, IQueryParameter } from './queryObject';
export class Interpreter {
    private escape: any;
    private partOfWhere: string[] = [];
    private partOfSelect: string = "*";
    private partOfJoin: string[] = [];
    private partOfLimt;
    private partOfOrderBy: string[] = [];
    private joinTeamp;
    constructor(escape?) {
        if (escape)
            this.escape = escape;
        else
            this.escape = function (value) { return value; }
    }

    GetFinalSql(tableName: string): string {
        let sqlCharts: string[] = [];
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
        if (this.partOfOrderBy && this.partOfOrderBy.length) {
            sqlCharts.push(`ORDER BY ${this.partOfOrderBy.join(',')}`);
        }
        if (this.partOfLimt) {
            if (this.partOfLimt.skip) {
                sqlCharts.push(`LIMIT ${this.partOfLimt.skip * this.partOfLimt.take},${this.partOfLimt.take}`);
            }
            else {
                sqlCharts.push(`LIMIT ${this.partOfLimt.take}`);
            }
        }

        sqlCharts.push(";");

        return sqlCharts.join(" ");
    }

    TransToInsertSql(entity: any, excludeFields?: string[]): string {
        let sqlStr = "INSERT INTO `" + entity.TableName() + "`";

        let entityMetadata = Define.DataDefine.Current.GetMetedata(entity);
        let keyList = [], valueList = [];

        entityMetadata.forEach(item => {
            if (excludeFields && excludeFields.indexOf(item.ColumnName) > -1) return;
            if (item.Mapping) return;
            keyList.push("`" + item.ColumnName + "`");
            if (entity[item.ColumnName] === undefined || entity[item.ColumnName] === null || entity[item.ColumnName] === '') {
                if (item.DefaultValue != undefined && item.DefaultValue != null) {
                    valueList.push(this.escape(item.DefaultValue));
                }
                else {
                    valueList.push("NULL");
                }
            }
            else {
                let data = entity[item.ColumnName]
                if (item.DataType == Define.DataType.Array) {
                    valueList.push(this.escape(data.join(',')));
                }
                else if (item.DataType == Define.DataType.JSON) {
                    valueList.push(this.escape(JSON.stringify(data)));
                }
                else {
                    valueList.push(this.escape(data));
                }
            }
        });
        sqlStr += " (" + keyList.join(',') + ") VALUES (" + valueList.join(',') + ");";
        return sqlStr;
    }

    TransToUpdateSql(entity: any, excludeFields?: string[]): string {
        let sqlStr = "UPDATE `" + entity.TableName() + "` SET ";

        let entityMetadata = Define.DataDefine.Current.GetMetedata(entity);
        let valueList = [];
        entityMetadata.forEach(item => {
            if (excludeFields && excludeFields.indexOf(item.ColumnName) > -1) return;
            if (item.Mapping) return;
            if (entity[item.ColumnName] === undefined || entity[item.ColumnName] === null || entity[item.ColumnName] === '') {
                if (item.DefaultValue != undefined && item.DefaultValue != null) {
                    valueList.push(`\`${item.ColumnName}\`=${this.escape(item.DefaultValue)}`);
                }
                else {
                    valueList.push(`\`${item.ColumnName}\`=NULL`);
                }
            }
            else {
                let data = entity[item.ColumnName];
                if (item.DataType == Define.DataType.Array) {
                    valueList.push(`\`${item.ColumnName}\`=${this.escape(data.join(','))}`);
                }
                else if (item.DataType == Define.DataType.JSON) {
                    valueList.push(`\`${item.ColumnName}\`=${this.escape(JSON.stringify(data))}`);
                }
                else {
                    valueList.push(`\`${item.ColumnName}\`=${this.escape(data)}`);
                }

            }
        });

        let primaryKeyObj = this.GetPrimaryKeyObj(entity);
        sqlStr += valueList.join(',') + " WHERE " + primaryKeyObj.key + "=" + this.escape(primaryKeyObj.value) + ";";

        return sqlStr;
    }

    TransToDeleteSql(func: any, entity: any, params?: IQueryParameter) {
        let sqlStr = "";
        if (func) {
            let s = this.TransToSQLOfWhere(func, entity.TableName(), params);
            sqlStr = "DELETE FROM `" + entity.TableName() + "` WHERE " + s + ";";
        }
        else {
            let primaryKeyObj = this.GetPrimaryKeyObj(entity);
            if (!primaryKeyObj.key) throw "entity not set primary key!";
            if (primaryKeyObj.value == null || primaryKeyObj.value == undefined) throw "the property " + primaryKeyObj.key + " can not be null!";
            sqlStr = "DELETE FROM `" + entity.TableName() + "` WHERE " + primaryKeyObj.key + "='" + primaryKeyObj.value + "';";
        }
        return sqlStr;
    }

    TransToSQLOfWhere(func: Function, tableName?: string, params?: IQueryParameter): string {
        // add to sql part of where;
        let sql = this.TransFuncToSQL(func, tableName, params);
        this.partOfWhere.push("(" + sql + ")");
        return sql;
    }
    TransToSQLOfContains(func: Function, values: any[], tableName: string) {
        let sql = "";
        let r = this.TransFuncToSQL(func, tableName);
        let fm = [];
        for (let item of values) {
            fm.push(this.escape(item));
        }
        sql = "(" + r + " IN (" + fm.join(",") + "))";
        this.partOfWhere.push(sql);
        return sql;
    }
    TransToSQLCount(entity) {
        let k = this.GetPrimaryKeyObj(entity);
        this.partOfSelect = `COUNT(${k.key})`;
        return this.partOfSelect;
    }

    TransToSQLOfSelect(entity: any);
    TransToSQLOfSelect(func: Function, tableName: string);
    TransToSQLOfSelect(p1: any, p2?: any) {
        if (arguments.length == 1) {
            this.partOfSelect = this.GetSelectFieldList(p1).join(",");
        }
        else if (arguments.length == 2) {
            let r = this.TransFuncToSQL(p1, p2);
            // add to sql part of select
            this.partOfSelect = r.split('AND').join(',');
        }

        return this.partOfSelect;
    }

    TransToSQLOfJoin(fEntity: any) {
        if (this.partOfSelect === "*") {
            this.partOfSelect = this.GetSelectFieldList(fEntity).join(",");
        }
        else {
            this.partOfSelect += ",";
            this.partOfSelect += this.GetSelectFieldList(fEntity).join(",");
        }

        this.joinTeamp = {
            fTableName: fEntity.TableName(),
        };
    }
    TransToSQLOfOn(func: Function, mTableName: string) {
        if (!this.joinTeamp) throw new Error("must use TransToSQLJoin() before!");
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

            if (funcCharList[i] === "==") funcCharList[i] = " = ";
        }

        let sql = "LEFT JOIN `" + fTableName + "` ON " + funcCharList.join("");
        this.partOfJoin.push(sql);

        return this.partOfJoin;
    }
    TransToSQLOfLimt(count: number, isSkip?: boolean) {
        if (isSkip) {
            this.partOfLimt.skip = count;
        }
        else {
            this.partOfLimt = { take: count, skip: 0 };
        }
    }
    TransTOSQLOfGroup(func: Function, tableName: string, isDesc: boolean = false) {
        let sql = this.TransFuncToSQL(func, tableName);
        let descStr = isDesc ? 'DESC' : '';
        this.partOfOrderBy.push(`${sql} ${descStr}`);

        return this.partOfOrderBy;
    }

    TransFuncToSQL(func: Function, tableName?: string, param?: any): string {
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
                    let tKey = key.replace(new RegExp('[$]', 'gm'), '');
                    funcCharList[index] = funcCharList[index].replace(new RegExp('[$]', "gm"), '');
                    funcCharList[index] = funcCharList[index].replace(new RegExp(tKey, "gm"), this.escape(param[key]));
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
                if (funcCharList[index - 1] === "==") funcCharList[index - 1] = "IS";
                else if (funcCharList[index - 1] === "!=") funcCharList[index - 1] = "IS NOT";
                funcCharList[index] = "NULL";
            }
            if (item.indexOf(".indexOf") > -1) {
                funcCharList[index] = funcCharList[index].replace(new RegExp("\\.indexOf", "gm"), " LIKE ");
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
    GetPrimaryKeyObj(entity: any) {
        let result: { key: string; value: any } = <any>{};
        for (let item of Define.DataDefine.Current.GetMetedata(entity)) {
            if (item.IsPrimaryKey) {
                result.key = item.ColumnName;
                result.value = entity[item.ColumnName];
            }
        }

        return result;
    }
    private GetSelectFieldList(entity) {
        let feildList = [];
        let tableName = entity.TableName();
        let entityClassName = entity.ClassName();
        let pList = Define.DataDefine.Current.GetMetedata(entity);
        for (let p of pList) {
            if (p.Mapping) continue;
            feildList.push(tableName + ".`" + p.ColumnName + "` AS " + entityClassName + "_" + p.ColumnName);
        }
        return feildList;
    }
}