import { Define } from "../../define/dataDefine";
import { EntityObjectFactory } from "../../entityObjectFactory";
const EntityObjectType = EntityObjectFactory.GetEntityObjectType('sqljs');

@Define.Table({ TableName: "account" })
export class Account extends EntityObjectType<Account>{
    @Define.PrimaryKey()
    id: string;

    @Define.Column({
        DataType: Define.DataType.VARCHAR,
        IsIndex: true
    })
    personId: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 })
    amount: number;

    @Define.Column({
        DataType: Define.DataType.VARCHAR,
        IsIndex: true
    })
    storeId: string;
}