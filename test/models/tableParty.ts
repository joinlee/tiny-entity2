import { EntityObjectMysql } from './../../mysql/entityObjectMysql';
import { Define } from "../../define/dataDefine";

@Define.Table({ TableName: "tableparty" })
export class TableParty extends EntityObjectMysql<TableParty> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    tableId: string;

    @Define.Column()
    orderId: string;
}