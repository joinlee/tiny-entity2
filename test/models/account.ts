import { EntityObjectMysql } from "../../mysql/entityObjectMysql";
import { Define } from "../../define/dataDefine";

@Define.Table({ TableName: "account" })
export class Account extends EntityObjectMysql<Account>{
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ DataType: Define.DataType.VARCHAR })
    personId: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 })
    amount: number;
}