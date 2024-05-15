"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        for (let i = 0; i < 10; i++) {
            let person = new person_1.Person();
            person.id = guid_1.Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();
            yield ctx.Create(person);
            personList.push(person);
        }
        console.log('personList', personList.length);
    }));
    it("no query criteria", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx2 = new testDataContext_1.TestDataContext();
        let list = yield ctx2.Person.ToList();
        assert.equal(list.length, 10);
    }));
    it("inculde query criteria", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        let age = 35;
        let list = yield ctx.Person.Where(x => x.age > age, { age }).ToList();
        assert.equal(list.length, personList.filter(x => x.age > age).length);
        assert.equal(list.filter(x => x.age < 35), 0);
    }));
    it("fuzzy query ", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        let params = {
            name: "likecheng"
        };
        let list = yield ctx.Person.Where(x => x.name.indexOf($args1), { $args1: params.name }).ToList();
        assert.equal(list.length, 10);
    }));
    it("using Select()", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        let age = 35;
        let list = yield ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();
        assert.equal(list.filter(x => x.name != null).length, 4);
        assert.equal(list.filter(x => x.id != null).length, 0);
    }));
    it("using Contains() ", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        let values = [30, 31, 32, 20];
        let list = yield ctx.Person.Contains(x => x.age, values).ToList();
        assert.equal(list.length, 3);
    }));
    it("no data", () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        yield ctx.Delete(x => x.id != null, ctx.Person);
        let result = yield ctx.Person.ToList();
        assert.equal(result.length, 0);
    }));
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        yield ctx.Delete(x => x.id != null, ctx.Person);
    }));
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
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        yield ctx.Create(person);
        yield ctx.Create(person2);
        for (let i = 0; i < 10; i++) {
            let account = new account_1.Account();
            account.id = guid_1.Guid.GetGuid();
            account.personId = person.id;
            account.amount = 100 + i / 2;
            yield ctx.Create(account);
            accountRecord.push(account);
            let ac = new account_1.Account();
            ac.id = guid_1.Guid.GetGuid();
            ac.personId = person2.id;
            ac.amount = 100 - i / 2;
            yield ctx.Create(ac);
            accountRecord.push(ac);
        }
    }));
    it("left join one table,account and ToList()", () => __awaiter(void 0, void 0, void 0, function* () {
        let list = yield ctx.Person
            .Join(ctx.Account).On((m, f) => m.id == f.personId)
            .Where(x => x.id == $args1, { $args1: person.id })
            .ToList();
        console.log(list);
        assert.equal(list.length, 1);
        assert.equal(list[0].accounts.length, 10);
        let values2 = [100 - 1 / 2, 100 + 1 / 2];
        let list2 = yield ctx.Person
            .Join(ctx.Account)
            .On((m, f) => m.id == f.personId)
            .Contains(x => x.amount, values2, ctx.Account)
            .ToList();
        assert.equal(list2.length, 2);
    }));
    it("using Select() ", () => __awaiter(void 0, void 0, void 0, function* () {
        let list = yield ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).Select(x => x.id).ToList();
        assert.equal(list.length, 20);
    }));
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        yield ctx.Delete(x => x.id != null, ctx.Person);
        yield ctx.Delete(x => x.id != null, ctx.Account);
    }));
});
describe("transaction", () => {
    it('事务处理失败回滚', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield transcation_1.Transaction(new testDataContext_1.TestDataContext(), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
                for (let i = 0; i < 10; i++) {
                    let person = new person_1.Person();
                    person.id = guid_1.Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    if (i == 9)
                        throw ' transaction error';
                    yield ctx.Create(person);
                }
            }));
        }
        catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new testDataContext_1.TestDataContext();
            let count = yield ctx.Person.Count();
            assert.equal(count, 0);
        }
    }));
    it('事务处理成功', () => __awaiter(void 0, void 0, void 0, function* () {
        let handlers = [];
        try {
            yield transcation_1.Transaction(new testDataContext_1.TestDataContext(), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
                for (let i = 0; i < 10; i++) {
                    let person = new person_1.Person();
                    person.id = guid_1.Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    yield ctx.Create(person);
                }
            }));
        }
        catch (error) {
            console.log(error);
        }
        finally {
            let ctx = new testDataContext_1.TestDataContext();
            let count = yield ctx.Person.Count();
            assert.equal(count, 10);
        }
    }));
    it('Query方法的事物处理', () => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        yield transcation_1.Transaction(ctx, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            let result = yield ctx.Query('select * from Person;', true);
            console.log(result);
        }));
        assert.equal(true, true);
    }));
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        let ctx = new testDataContext_1.TestDataContext();
        yield ctx.Delete(x => x.id != null, ctx.Person);
    }));
});
