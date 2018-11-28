import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Account } from "./models/account";
import { Order } from './models/order';
import { TestDataContext } from './testDataContext';
import { Guid } from './guid';
import * as assert from "assert";
import { Person } from './models/person';
import { Transaction } from '../transcation';

process.env.tinyLog = "off";

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
        let list = await ctx.Person.Where(x => x.name.indexOf($args1), { $args1: params.name }).ToList();
        assert.equal(list.length, 10);
    })
    it("using Select()", async () => {
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();

        assert.equal(list.filter(x => x.name != null).length, 4);
        assert.equal(list.filter(x => x.id != null).length, 0);
    })
    it("using Contains() ", async () => {
        let values = [30, 31, 32, 20];
        let list = await ctx.Person.Contains(x => x.age, values).ToList();
        assert.equal(list.length, 3);
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

    it("left join one table,account and ToList()", async () => {
        let list = await ctx.Person
            .Join(ctx.Account).On((m, f) => m.id == f.personId)
            .Where(x => x.id == $args1, { $args1: person.id })
            .ToList();
        console.log(list);
        assert.equal(list.length, 1);
        assert.equal(list[0].accounts.length, 10);

        let values2 = [100 - 1 / 2, 100 + 1 / 2];
        let list2 = await ctx.Person
            .Join(ctx.Account)
            .On((m, f) => m.id == f.personId)
            .Contains<Account>(x => x.amount, values2, ctx.Account)
            .ToList();

        assert.equal(list2.length, 2);
    })
    it("using Select() ", async () => {
        let list = await ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).Select(x => x.id).ToList();
        assert.equal(list.length, 20);
    })

    after(async () => {
        // clean person table from database;
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
        await ctx.Delete<Account>(x => x.id != null, ctx.Account);
    })
});

describe("transaction", () => {
    it('事务处理失败回滚', async () => {
        try {
            await Transaction(new TestDataContext(), async (ctx) => {
                //insert 10 persons to database;
                for (let i = 0; i < 10; i++) {
                    let person = new Person();
                    person.id = Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    if (i == 9)
                        throw ' transaction error';
                    await ctx.Create(person);
                }
            });
        } catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new TestDataContext();
            let count = await ctx.Person.Count();
            assert.equal(count, 0);
        }
    });
    it('事务处理成功', async () => {
        try {
            await Transaction(new TestDataContext(), async (ctx) => {
                //insert 10 persons to database;
                for (let i = 0; i < 10; i++) {
                    let person = new Person();
                    person.id = Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    await ctx.Create(person);
                }
            });
        } catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new TestDataContext();
            let count = await ctx.Person.Count();
            assert.equal(count, 10);
        }

    });

    after(async () => {
        let ctx = new TestDataContext();
        // clean person table from database;
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
    });
});


