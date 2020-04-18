import { Define } from '../../define/dataDefine';
import { EntityObjectFactory } from '../../entityObjectFactory';
const EntityObjectType = EntityObjectFactory.GetEntityObjectType('sqljs');

@Define.Table({ TableName: "desktable" })
export class DeskTable extends EntityObjectType<DeskTable> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    name: string;

    @Define.Column({ DefaultValue: "opening", DataType: Define.DataType.VARCHAR })
    status: string;
}