"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_1 = require("./models/account");
const testDataContext_1 = require("./testDataContext");
const guid_1 = require("./guid");
const assert = require("assert");
const person_1 = require("./models/person");
const transcation_1 = require("../transcation");
process.env.tinyLog = "on";
describe("query data", () => {
    let personList = [];
    before(async () => {
        let ctx = new testDataContext_1.TestDataContext();
        for (let i = 0; i < 10; i++) {
            let person = new person_1.Person();
            person.id = guid_1.Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();
            await ctx.Create(person);
            personList.push(person);
        }
        console.log('personList', personList.length);
    });
    it("no query criteria", async () => {
        let ctx2 = new testDataContext_1.TestDataContext();
        let list = await ctx2.Person.ToList();
        assert.equal(list.length, 10);
    });
    it("inculde query criteria", async () => {
        let ctx = new testDataContext_1.TestDataContext();
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).ToList();
        assert.equal(list.length, personList.filter(x => x.age > age).length);
        assert.equal(list.filter(x => x.age < 35), 0);
    });
    it("fuzzy query ", async () => {
        let ctx = new testDataContext_1.TestDataContext();
        let params = {
            name: "likecheng"
        };
        let list = await ctx.Person.Where(x => x.name.indexOf($args1), { $args1: params.name }).ToList();
        assert.equal(list.length, 10);
    });
    it("using Select()", async () => {
        let ctx = new testDataContext_1.TestDataContext();
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();
        assert.equal(list.filter(x => x.name != null).length, 4);
        assert.equal(list.filter(x => x.id != null).length, 0);
    });
    it("using Contains() ", async () => {
        let ctx = new testDataContext_1.TestDataContext();
        let values = [30, 31, 32, 20];
        let list = await ctx.Person.Contains(x => x.age, values).ToList();
        assert.equal(list.length, 3);
    });
    it("no data", async () => {
        let ctx = new testDataContext_1.TestDataContext();
        await ctx.Delete(x => x.id != null, ctx.Person);
        let result = await ctx.Person.ToList();
        assert.equal(result.length, 0);
    });
    after(async () => {
        let ctx = new testDataContext_1.TestDataContext();
        await ctx.Delete(x => x.id != null, ctx.Person);
    });
});
describe("using left join key work query multi tables ", () => {
    let ctx = new testDataContext_1.TestDataContext();
    let person = new person_1.Person();
    person.id = guid_1.Guid.GetGuid();
    person.name = "jack lee";
    person.age = 25;
    let person2 = new person_1.Person();
    person2.id = guid_1.Guid.GetGuid();
    person2.name = "dong fang bu bai";
    person2.age = 20;
    let accountRecord = [];
    before(async () => {
        await ctx.Create(person);
        await ctx.Create(person2);
        for (let i = 0; i < 10; i++) {
            let account = new account_1.Account();
            account.id = guid_1.Guid.GetGuid();
            account.personId = person.id;
            account.amount = 100 + i / 2;
            await ctx.Create(account);
            accountRecord.push(account);
            let ac = new account_1.Account();
            ac.id = guid_1.Guid.GetGuid();
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
            .Contains(x => x.amount, values2, ctx.Account)
            .ToList();
        assert.equal(list2.length, 2);
    });
    it("using Select() ", async () => {
        let list = await ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).Select(x => x.id).ToList();
        assert.equal(list.length, 20);
    });
    after(async () => {
        await ctx.Delete(x => x.id != null, ctx.Person);
        await ctx.Delete(x => x.id != null, ctx.Account);
    });
});
describe("transaction", () => {
    it('事务处理失败回滚', async () => {
        try {
            await transcation_1.Transaction(new testDataContext_1.TestDataContext(), async (ctx) => {
                for (let i = 0; i < 10; i++) {
                    let person = new person_1.Person();
                    person.id = guid_1.Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    if (i == 9)
                        throw ' transaction error';
                    await ctx.Create(person);
                }
            });
        }
        catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new testDataContext_1.TestDataContext();
            let count = await ctx.Person.Count();
            assert.equal(count, 0);
        }
    });
    it('事务处理成功', async () => {
        let handlers = [];
        try {
            await transcation_1.Transaction(new testDataContext_1.TestDataContext(), async (ctx) => {
                for (let i = 0; i < 10; i++) {
                    let person = new person_1.Person();
                    person.id = guid_1.Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    await ctx.Create(person);
                }
            });
        }
        catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new testDataContext_1.TestDataContext();
            let count = await ctx.Person.Count();
            assert.equal(count, 10);
        }
    });
    it('Query方法的事物处理', async () => {
        let ctx = new testDataContext_1.TestDataContext();
        await transcation_1.Transaction(ctx, async (ctx) => {
            let result = await ctx.Query('select * from Person;', true);
            console.log(result);
        });
        assert.equal(true, true);
    });
    after(async () => {
        let ctx = new testDataContext_1.TestDataContext();
        await ctx.Delete(x => x.id != null, ctx.Person);
    });
});
//# sourceMappingURL=test.js.map