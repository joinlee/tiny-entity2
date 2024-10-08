import { Define } from '../../define/dataDefine';
import { Account } from './account';
import { EntityObjectFactory } from '../../entityObjectFactory';
const EntityObjectType = EntityObjectFactory.GetEntityObjectType('mysql');

@Define.Table({ TableName: "person" })
export class Person extends EntityObjectType<Person> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ DataType: Define.DataType.INT, DataLength: 11, DecimalPoint: 3 })
    weight: number;

    @Define.Column()
    name: string;

    @Define.Column()
    address: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11 })
    age: number;

    @Define.Column({ DataType: Define.DataType.BIGINT })
    birth: number;

    @Define.Column({
        DataType: Define.DataType.VARCHAR,
        DefaultValue: '15928934970'
    })
    phone: string;

    @Define.Column({
        DataType: Define.DataType.BOOL
    })
    gender: Boolean;

    @Define.Column({
        DataType: Define.DataType.VARCHAR
    })
    email: string;

    @Define.Column({
        DataType: Define.DataType.BOOL
    })
    status: Boolean;

    @Define.Column({
        DataType: Define.DataType.JSON
    })
    extends: IPersonExtends;

    @Define.Mapping({
        Mapping: 'Account',
        MappingKey: 'personId'
    })
    accounts: Account[];
}

export interface IPersonExtends {

}