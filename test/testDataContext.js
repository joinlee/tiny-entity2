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
const config = require("./config");
const dataContextMysql_1 = require("../mysql/dataContextMysql");
const order_1 = require("./models/order");
const person_1 = require("./models/person");
const table_1 = require("./models/table");
const tableParty_1 = require("./models/tableParty");
class TestDataContext extends dataContextMysql_1.MysqlDataContext {
    constructor() {
        super(config);
        this.order = new order_1.Order(this);
        this.person = new person_1.Person(this);
        this.deskTable = new table_1.DeskTable(this);
        this.tableParty = new tableParty_1.TableParty(this);
    }
    get Order() { return this.order; }
    get Person() { return this.person; }
    get DeskTable() { return this.deskTable; }
    get TableParty() { return this.tableParty; }
    CreateDatabase() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("CreateDatabase").call(this);
            yield _super("CreateTable").call(this, this.order);
            yield _super("CreateTable").call(this, this.person);
            yield _super("CreateTable").call(this, this.deskTable);
            yield _super("CreateTable").call(this, this.tableParty);
            return true;
        });
    }
}
exports.TestDataContext = TestDataContext;
//# sourceMappingURL=testDataContext.js.map