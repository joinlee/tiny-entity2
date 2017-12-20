import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Order } from './models/order';
import { TestDataContext } from './testDataContext';
import { Guid } from './guid';
import * as assert from "assert";
import { Person } from './models/person';

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

// =============================================================

// describe("CreateDatabase and Tables", () => {
//     let ctx = new TestDataContext();
//     it("when database exist", async () => {
//         let r = await ctx.CreateDatabase();
//         console.log(r);
//     })
// });

describe("ToList", () => {
    let ctx = new TestDataContext();

    before(async () => {
        //insert 10 persons to database;
        for (let i = 0; i < 10; i++) {
            let person = new Person();
            person.id = Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();

            await ctx.Create(person);
        }
    })

    it("no query criteria", async () => {
        let list = await ctx.Person.ToList();
        assert.equal(list.length, 1);
        console.log(list[0]);
    })

    it("inculde query criteria", async () => {

    })

    after(async () => {
        // clean person table from database;
        let list = await ctx.Person.ToList();
        for (let item of list) {
            await ctx.Delete(item);
        }
    })
})



