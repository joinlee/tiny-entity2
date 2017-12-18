import { Define } from './../define/dataDefine';
import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Interpreter } from '../interpreter';
import mysql = require("mysql");
import { Order } from './models/order';
import { TestDataContext } from './testDataContext';
import { Guid } from './guid';
import * as assert from "assert";

// let t = new DeskTable();
// t.id = "123";
// console.log(t, t.toString());

// let tp = new TableParty();

// let r = Define.DataDefine.Current.GetMetedata(t);
// console.log(r);

// let r1 = Define.DataDefine.Current.GetMetedata(tp);
// console.log(r1);

// let i = new Interpreter(mysql.escape);
// console.log(i.TransToUpdateSql(t));


// let order = new Order();
// let orderId = "123";
// order.Where(x => x.id == orderId, ["orderId"], [orderId]).Where(x => x.cart != null).ToList();

// Select * from tableParty join order on tableparty.orderId == order.id wh


// let x = tp
//     .Join(order).On((m, f) => m.orderId == f.id)
//     .Where(x => x.tableId == orderId, ["orderId"], [orderId])
//     .Where<Order>(x => x.amountDue == 0, order)
//     .ToList<{ orders: Order; tableparty: TableParty }>();


// describe("ToList", () => {
//     let ctx = new TestDataContext();
//     let tableId = "a66fcbd29d2b4ac683c57520bfca5728";
//     before(async () => {
//         let tp = new TableParty();
//         tp.id = Guid.GetGuid();
//         tp.orderId = "";
//     })

//     it("when qeury single table.")
//     it("when query multiple tables.", async () => {
//         let orderId = "xxx";
//         let x = await ctx.TableParty
//             .Join(ctx.Order).On((m, f) => m.orderId == f.id)
//             .Where(x => x.tableId == orderId, ["orderId"], [orderId])
//             .Where<Order>(x => x.amountDue == 0, ctx.Order)
//             .ToList<{ orders: Order; tableparty: TableParty }>();

//         console.log(x);
//     })

//     after(async () => {

//     })
// });

describe("CreateDatabase and Tables", () => {
    let ctx = new TestDataContext();
    it("when database exist", async () => {
        let r = await ctx.CreateDatabase();
        console.log(r);
    })
});



