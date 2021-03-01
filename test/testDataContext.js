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
exports.TestDataContext = void 0;
const config = require("./config");
const dataContextMysql_1 = require("../mysql/dataContextMysql");
const account_1 = require("./models/account");
const order_1 = require("./models/order");
const person_1 = require("./models/person");
const table_1 = require("./models/table");
const tableParty_1 = require("./models/tableParty");
const user_1 = require("./models/user");
class TestDataContext extends dataContextMysql_1.MysqlDataContext {
    constructor() {
        super(config);
        this.account = new account_1.Account(this);
        this.order = new order_1.Order(this);
        this.person = new person_1.Person(this);
        this.deskTable = new table_1.DeskTable(this);
        this.tableParty = new tableParty_1.TableParty(this);
        this.users = new user_1.Users(this);
    }
    get Account() { return this.account; }
    get Order() { return this.order; }
    get Person() { return this.person; }
    get DeskTable() { return this.deskTable; }
    get TableParty() { return this.tableParty; }
    get Users() { return this.users; }
    CreateDatabase() {
        const _super = Object.create(null, {
            CreateDatabase: { get: () => super.CreateDatabase },
            CreateTable: { get: () => super.CreateTable }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.CreateDatabase.call(this);
            yield _super.CreateTable.call(this, this.account);
            yield _super.CreateTable.call(this, this.order);
            yield _super.CreateTable.call(this, this.person);
            yield _super.CreateTable.call(this, this.deskTable);
            yield _super.CreateTable.call(this, this.tableParty);
            yield _super.CreateTable.call(this, this.users);
            return true;
        });
    }
    GetEntityObjectList() {
        return [this.account, this.order, this.person, this.deskTable, this.tableParty, this.users];
    }
}
exports.TestDataContext = TestDataContext;
//# sourceMappingURL=testDataContext.js.map