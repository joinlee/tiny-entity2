import { MysqlDataContext } from "../mysql/dataContextMysql";
import { Order } from "./models/order";
import { TableParty } from "./models/tableParty";
import { DeskTable } from "./models/table";
const config = require("./config");

export class TestDataContext extends MysqlDataContext {
    private order: Order;
    private tableParty: TableParty;
    private deskTable: DeskTable;

    constructor() {
        super(config);

        this.order = new Order(this);
        this.tableParty = new TableParty(this);
        this.deskTable = new DeskTable(this);
    }

    get Order() { return this.order; }
    get TableParty() { return this.tableParty; }
    get DeskTable() { return this.deskTable; }

    async CreateDatabase() {
        await super.CreateDatabase();
        await super.CreateTable(this.order);
        await super.CreateTable(this.deskTable);
        await super.CreateTable(this.tableParty);
        return true;
    }
}