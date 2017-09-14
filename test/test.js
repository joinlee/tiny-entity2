"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataDefine_1 = require("./../define/dataDefine");
const table_1 = require("./models/table");
let t = new table_1.DeskTable();
console.log(t, t.toString());
let r = dataDefine_1.Define.DataDefine.Current.GetMetedata();
console.log(r);
//# sourceMappingURL=test.js.map