import { EntityObjectMysql } from './../../mysql/entityObjectMysql';
import { Define } from '../../define/dataDefine';

@Define.Table({ TableName: "users" })
export class Users extends EntityObjectMysql<Users> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 })
    amountDue: number;

    @Define.Column()
    cart;

    @Define.Column()
    cashier;

    @Define.Column()
    checkout;

    @Define.Column()
    checkoutMode: string;

    @Define.Column({ DataType: Define.DataType.BIGINT })
    closeTime: number;

    @Define.Column()
    createTime: number;

    @Define.Column()
    creator: { id: string, name: string };
}