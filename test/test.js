"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const account_1 = require("./models/account");
const testDataContext_1 = require("./testDataContext");
const guid_1 = require("./guid");
const assert = require("assert");
const person_1 = require("./models/person");
describe("query data", () => {
    let ctx = new testDataContext_1.TestDataContext();
    let personList = [];
    before(() => __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < 10; i++) {
            let person = new person_1.Person();
            person.id = guid_1.Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();
            yield ctx.Create(person);
            personList.push(person);
        }
    }));
    it("no query criteria", () => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.ToList();
        assert.equal(list.length, 10);
    }));
    it("inculde query criteria", () => __awaiter(this, void 0, void 0, function* () {
        let age = 35;
        let list = yield ctx.Person.Where(x => x.age > age, { age }).ToList();
        assert.equal(list.length, personList.filter(x => x.age > age).length);
        assert.equal(list.filter(x => x.age < 35), 0);
    }));
    it("fuzzy query ", () => __awaiter(this, void 0, void 0, function* () {
        let params = {
            name: "likecheng"
        };
        let list = yield ctx.Person.Where(x => x.name.indexOf(params.name), { "params.name": params.name }).ToList();
        assert.equal(list.length, 10);
    }));
    it("select part of feilds", () => __awaiter(this, void 0, void 0, function* () {
        let age = 35;
        let list = yield ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();
        assert.equal(list.filter(x => x.name != null).length, 4);
        assert.equal(list.filter(x => x.id != null).length, 0);
    }));
    it("no data", () => __awaiter(this, void 0, void 0, function* () {
        yield ctx.Delete(x => x.id != null, ctx.Person);
        let result = yield ctx.Person.ToList();
        assert.equal(result.length, 0);
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
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
    before(() => __awaiter(this, void 0, void 0, function* () {
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
    it("query person left join accounts", () => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).ToList();
        assert.equal(list.length, 20);
    }));
    it("query person left join accounts select id", () => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.Join(ctx.Account).On((m, f) => m.id == f.personId).Select(x => x.id).ToList();
        assert.equal(list.length, 20);
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        yield ctx.Delete(x => x.id != null, ctx.Person);
        yield ctx.Delete(x => x.id != null, ctx.Account);
    }));
});
//# sourceMappingURL=test.js.map