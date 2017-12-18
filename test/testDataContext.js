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
const dataContextMysql_1 = require("../mysql/dataContextMysql");
const order_1 = require("./models/order");
const tableParty_1 = require("./models/tableParty");
const table_1 = require("./models/table");
let mysqlConnectOptions = {
    connectionLimit: 50,
    host: '172.16.254.127',
    user: 'root',
    password: 'onetwo',
    database: 'fbs_db',
    charset: "utf8",
    collate: "utf8_unicode_ci"
};
class TestDataContext extends dataContextMysql_1.MysqlDataContext {
    constructor() {
        super(mysqlConnectOptions);
        this.order = new order_1.Order(this);
        this.tableParty = new tableParty_1.TableParty(this);
        this.deskTable = new table_1.DeskTable(this);
    }
    get Order() { return this.order; }
    get TableParty() { return this.tableParty; }
    get DeskTable() { return this.deskTable; }
    CreateDatabase() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield _super("CreateDatabase").call(this);
            yield _super("CreateTable").call(this, this.tableParty);
            yield _super("CreateTable").call(this, this.deskTable);
            return true;
        });
    }
}
exports.TestDataContext = TestDataContext;
//# sourceMappingURL=testDataContext.js.map