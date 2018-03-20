import { EntityObjectMysql } from './../../mysql/entityObjectMysql';
import { Define } from '../../define/dataDefine';
import { Account } from './account';

@Define.Table({ TableName: "person" })
export class Person extends EntityObjectMysql<Person> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 })
    weight: number;

    @Define.Column()
    name: string;

    @Define.Column({ DataType: Define.DataType.INT, DataLength: 11 })
    age: number;

    @Define.Column({ DataType: Define.DataType.BIGINT })
    birth: number;

    @Define.Column({ DataType: Define.DataType.VARCHAR })
    phone: string;

    @Define.Mapping({ Mapping: "Account" })
    accounts: Account[];
}