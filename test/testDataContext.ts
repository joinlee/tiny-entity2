import { MysqlDataContext } from "../mysql/dataContextMysql";
import { Order } from "./models/order";
import { TableParty } from "./models/tableParty";
import { DeskTable } from "./models/table";

let mysqlConnectOptions = {
    connectionLimit: 50,
    host: '172.16.254.127',
    user: 'root',
    password: 'onetwo',
    database: 'fbs_db',
    charset: "utf8",
    collate: "utf8_unicode_ci"
}

export class TestDataContext extends MysqlDataContext {
    private order: Order;
    private tableParty: TableParty;
    private deskTable: DeskTable;

    constructor() {
        super(mysqlConnectOptions);

        this.order = new Order(this);
        this.tableParty = new TableParty(this);
        this.deskTable = new DeskTable(this);
    }

    get Order() { return this.order; }
    get TableParty() { return this.tableParty; }
    get DeskTable() { return this.deskTable; }

    async CreateDatabase() {
        await super.CreateDatabase();
        //await super.CreateTable(this.order);
        await super.CreateTable(this.tableParty);
        await super.CreateTable(this.deskTable);
        return true;
    }
}