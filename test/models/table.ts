import { EntityObject } from './../../entityObject';
import { Define } from '../../define/dataDefine';

@Define.Table({ TableName: "desktable" })
export class DeskTable extends EntityObject<DeskTable> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    name: string;

    @Define.Column({ DefualtValue: "opening", DataType: Define.DataType.VARCHAR })
    status: string;
}