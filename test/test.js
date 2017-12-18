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
describe("CreateDatabase and Tables", () => {
    let ctx = new testDataContext_1.TestDataContext();
    it("when database exist", () => __awaiter(this, void 0, void 0, function* () {
        let r = yield ctx.CreateDatabase();
        console.log(r);
    }));
});
//# sourceMappingURL=test.js.map