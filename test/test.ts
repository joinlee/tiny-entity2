import { Define } from './../define/dataDefine';
import { DeskTable } from './models/table';

let t = new DeskTable();
console.log(t, t.toString());

let r = Define.DataDefine.Current.GetMetedata();
console.log(r);