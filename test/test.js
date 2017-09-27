"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataDefine_1 = require("./../define/dataDefine");
const table_1 = require("./models/table");
const tableParty_1 = require("./models/tableParty");
const interpreter_1 = require("../interpreter");
const mysql = require("mysql");
let t = new table_1.DeskTable();
t.id = "123";
console.log(t, t.toString());
let tp = new tableParty_1.TableParty();
let r = dataDefine_1.Define.DataDefine.Current.GetMetedata(t);
console.log(r);
let r1 = dataDefine_1.Define.DataDefine.Current.GetMetedata(tp);
console.log(r1);
let i = new interpreter_1.Interpreter(mysql.escape);
console.log(i.TransToUpdateSql(t));
//# sourceMappingURL=test.js.map