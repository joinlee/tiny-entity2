import { Define } from '../../define/dataDefine';

@Define.Table({ TableName: "orders" })
export class Order {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    amountDue: number;

    @Define.Column()
    cart;

    @Define.Column()
    cashier;

    @Define.Column()
    checkout;

    @Define.Column()
    checkoutMode: string;

    @Define.Column()
    closeTime: number;

    @Define.Column()
    createTime: number;

    @Define.Column()
    creator: { id: string, name: string };
}