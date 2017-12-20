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
describe("ToList", () => {
    let ctx = new testDataContext_1.TestDataContext();
    before(() => __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < 10; i++) {
            let person = new person_1.Person();
            person.id = guid_1.Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();
            yield ctx.Create(person);
        }
    }));
    it("no query criteria", () => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.ToList();
        assert.equal(list.length, 1);
        console.log(list[0]);
    }));
    it("inculde query criteria", () => __awaiter(this, void 0, void 0, function* () {
    }));
    after(() => __awaiter(this, void 0, void 0, function* () {
        let list = yield ctx.Person.ToList();
        for (let item of list) {
            yield ctx.Delete(item);
        }
    }));
});
//# sourceMappingURL=test.js.map