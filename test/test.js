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
        assert.equal(list.filter(x => x.name != null).length, 10);
        assert.equal(list.filter(x => x.id != null).length, 0);
    }));
    it("no data", () => __awaiter(this, void 0, void 0, function* () {
        yield ctx.Delete(x => x.id != null, ctx.Person);
        let result = yield ctx.Person.ToList();
        assert.equal(result.length, 0);
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.ToList();
        for (let item of list) {
            yield ctx.Delete(item);
        }
    }));
});
describe("using left join key work query multi tables ", () => {
    let ctx = new testDataContext_1.TestDataContext();
    before(() => __awaiter(this, void 0, void 0, function* () {
    }));
});
//# sourceMappingURL=test.js.map