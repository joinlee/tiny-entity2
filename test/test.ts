import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Account } from "./models/account";
import { Order } from './models/order';
import { TestDataContext } from './testDataContext';
import { Guid } from './guid';
import * as assert from "assert";
import { Person } from './models/person';

// describe("CreateDatabase and Tables", () => {
//     let ctx = new TestDataContext();
//     it("when database exist", async () => {
//         let r = await ctx.CreateDatabase();
//         console.log(r);
//     })
// });

describe("query data", () => {
    let ctx = new TestDataContext();
    let personList: Person[] = [];

    before(async () => {
        //insert 10 persons to database;
        for (let i = 0; i < 10; i++) {
            let person = new Person();
            person.id = Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();

            await ctx.Create(person);
            personList.push(person);
        }
    })

    it("no query criteria", async () => {
        let list = await ctx.Person.ToList();
        assert.equal(list.length, 10);
    })

    it("inculde query criteria", async () => {
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).ToList();

        assert.equal(list.length, personList.filter(x => x.age > age).length);
        assert.equal(list.filter(x => x.age < 35), 0);
    })
    it("fuzzy query ", async () => {
        let params = {
            name: "likecheng"
        };
        let list = await ctx.Person.Where(x => x.name.indexOf(params.name), { "params.name": params.name }).ToList();
        assert.equal(list.length, 10);
    })
    it("select part of feilds", async () => {
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();

        assert.equal(list.filter(x => x.name != null).length, 4);
        assert.equal(list.filter(x => x.id != null).length, 0);
    })

    it("no data", async () => {
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
        let result = await ctx.Person.ToList();
        assert.equal(result.length, 0);
    })

    after(async () => {
        // clean person table from database;
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
    })
})

describe("using left join key work query multi tables ", () => {
    let ctx = new TestDataContext();

    let person = new Person();
    person.id = Guid.GetGuid();
    person.name = "jack lee";
    person.age = 25;

    let person2 = new Person();
    person2.id = Guid.GetGuid();
    person2.name = "dong fang bu bai";
    person2.age = 20;

    let accountRecord: Account[] = [];

    before(async () => {
        // init data to database
        await ctx.Create(person);
        await ctx.Create(person2);
        for (let i = 0; i < 10; i++) {
            let account = new Account();
            account.id = Guid.GetGuid();
            account.personId = person.id;
            account.amount = 100 + i / 2;

            await ctx.Create(account);
            accountRecord.push(account);

            let ac = new Account();
            ac.id = Guid.GetGuid();
            ac.personId = person2.id;
            ac.amount = 100 - i / 2;

            await ctx.Create(ac);
            accountRecord.push(ac);
        }
    });

    it("query person left join accounts", async () => {
        let list = await ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).ToList();
        assert.equal(list.length, 20);
    })
    it("query person left join accounts select id", async () => {
        let list = await ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).Select(x => x.id).ToList();
        assert.equal(list.length, 20);
    })

    after(async () => {
        // clean person table from database;
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
        await ctx.Delete<Account>(x => x.id != null, ctx.Account);
    })
})



