const config = require("../config");
import { MysqlDataContext } from "../mysql/dataContextMysql";
import { Order } from "./models/order"
import { Person } from "./models/person"
import { DeskTable } from "./models/table"
import { TableParty } from "./models/tableParty"
 export class TestDataContext extends MysqlDataContext{
private order: Order;
private person: Person;
private deskTable: DeskTable;
private tableParty: TableParty;
 constructor() { 
 super(config);
this.order = new Order(this);
this.person = new Person(this);
this.deskTable = new DeskTable(this);
this.tableParty = new TableParty(this);}
get Order() { return this.order; }
get Person() { return this.person; }
get DeskTable() { return this.deskTable; }
get TableParty() { return this.tableParty; }
 async CreateDatabase() { 
 await super.CreateDatabase(); 
await super.CreateTable(this.order);
await super.CreateTable(this.person);
await super.CreateTable(this.deskTable);
await super.CreateTable(this.tableParty);
 return true; 
} 
}