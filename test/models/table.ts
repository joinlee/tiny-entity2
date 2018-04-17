import { EntityObject } from './../../entityObject';
import { Define } from '../../define/dataDefine';
import { EntityObjectMysql } from '../../mysql/entityObjectMysql';

@Define.Table({ TableName: "desktable" })
export class DeskTable extends EntityObjectMysql<DeskTable> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    name: string;

    @Define.Column({ DefaultValue: "opening", DataType: Define.DataType.VARCHAR })
    status: string;
}