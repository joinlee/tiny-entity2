import { Define } from './../define/dataDefine';
import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");

let t = new DeskTable();
t.id = "123";
console.log(t, t.toString());

let tp = new TableParty();

let r = Define.DataDefine.Current.GetMetedata(t);
console.log(r);

let r1 = Define.DataDefine.Current.GetMetedata(tp);
console.log(r1);

let i = new Interpreter(mysql.escape);
console.log(i.TransToUpdateSql(t));



