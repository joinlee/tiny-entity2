import { Define } from "../../define/dataDefine";
import { EntityObject } from '../../entityObject';

@Define.Table({ TableName: "tableparty" })
export class TableParty extends EntityObject<TableParty> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    tableId: string;

    @Define.Column()
    orderId: string;
}