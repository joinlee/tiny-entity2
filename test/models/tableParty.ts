import { Define } from "../../define/dataDefine";
import { EntityObjectFactory } from '../../entityObjectFactory';
const EntityObjectType = EntityObjectFactory.GetEntityObjectType('sqlite');

@Define.Table({ TableName: "tableparty" })
export class TableParty extends EntityObjectType<TableParty> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ IsIndex: true })
    tableId: string;

    @Define.Column({ IsIndex: true })
    orderId: string;
}