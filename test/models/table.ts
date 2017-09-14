import { EntityObject } from './../../entityObject';
import { Define } from '../../define/dataDefine';

@Define.Table({ TableName: "desktable" })
export class DeskTable {
    @Define.PrimaryKey()
    id: string;

    @Define.Column()
    name: string;

    @Define.Column({ DefualtValue: "opening", DataType: Define.DataType.STRING })
    status: string;
}