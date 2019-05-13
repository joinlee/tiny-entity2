
            const config = require("./config");
import { MysqlDataContext } from "../mysql/dataContextMysql"
import { Account } from "./models/account"
import { Order } from "./models/order"
import { Person } from "./models/person"
import { DeskTable } from "./models/table"
import { TableParty } from "./models/tableParty"
import { Users } from "./models/user"
            export class TestDataContext extends MysqlDataContext {
                private account: Account;
private order: Order;
private person: Person;
private deskTable: DeskTable;
private tableParty: TableParty;
private users: Users;
                constructor(){
                    super(config);
                    this.account = new Account(this);
this.order = new Order(this);
this.person = new Person(this);
this.deskTable = new DeskTable(this);
this.tableParty = new TableParty(this);
this.users = new Users(this);
                }
                get Account() { return this.account; }
get Order() { return this.order; }
get Person() { return this.person; }
get DeskTable() { return this.deskTable; }
get TableParty() { return this.tableParty; }
get Users() { return this.users; }
                async CreateDatabase(){
                    await super.CreateDatabase();
                    await super.CreateTable(this.account);
await super.CreateTable(this.order);
await super.CreateTable(this.person);
await super.CreateTable(this.deskTable);
await super.CreateTable(this.tableParty);
await super.CreateTable(this.users);
                    return true;
                }

                GetEntityObjectList(){
                    return [this.account,this.order,this.person,this.deskTable,this.tableParty,this.users];
                }
            }
            