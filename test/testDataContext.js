"use strict";
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
    async CreateDatabase() {
        await super.CreateDatabase();
        await super.CreateTable(this.account);
        await super.CreateTable(this.order);
        await super.CreateTable(this.person);
        await super.CreateTable(this.deskTable);
        await super.CreateTable(this.tableParty);
        await super.CreateTable(this.users);
        return true;
    }
    GetEntityObjectList() {
        return [this.account, this.order, this.person, this.deskTable, this.tableParty, this.users];
    }
}
exports.TestDataContext = TestDataContext;
//# sourceMappingURL=testDataContext.js.map