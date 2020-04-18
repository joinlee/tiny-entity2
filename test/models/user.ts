import { Define } from '../../define/dataDefine';
import { EntityObjectFactory } from '../../entityObjectFactory';
const EntityObjectType = EntityObjectFactory.GetEntityObjectType('sqljs');

@Define.Table({ TableName: "users" })
export class Users extends EntityObjectType<Users> {
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