"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataDefine_1 = require("../../define/dataDefine");
const entityObjectFactory_1 = require("../../entityObjectFactory");
const EntityObjectType = entityObjectFactory_1.EntityObjectFactory.GetEntityObjectType('sqlite');
let Person = class Person extends EntityObjectType {
};
__decorate([
    dataDefine_1.Define.PrimaryKey(),
    __metadata("design:type", String)
], Person.prototype, "id", void 0);
__decorate([
    dataDefine_1.Define.Column({ DataType: dataDefine_1.Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 }),
    __metadata("design:type", Number)
], Person.prototype, "weight", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    dataDefine_1.Define.Column({ DataType: dataDefine_1.Define.DataType.INT, DataLength: 11 }),
    __metadata("design:type", Number)
], Person.prototype, "age", void 0);
__decorate([
    dataDefine_1.Define.Column({ DataType: dataDefine_1.Define.DataType.BIGINT }),
    __metadata("design:type", Number)
], Person.prototype, "birth", void 0);
__decorate([
    dataDefine_1.Define.Column({
        DataType: dataDefine_1.Define.DataType.VARCHAR,
        DefaultValue: '15928934970'
    }),
    __metadata("design:type", String)
], Person.prototype, "phone", void 0);
__decorate([
    dataDefine_1.Define.Column({
        DataType: dataDefine_1.Define.DataType.BOOL
    }),
    __metadata("design:type", Boolean)
], Person.prototype, "gender", void 0);
__decorate([
    dataDefine_1.Define.Column({
        DataType: dataDefine_1.Define.DataType.VARCHAR
    }),
    __metadata("design:type", String)
], Person.prototype, "email", void 0);
__decorate([
    dataDefine_1.Define.Column({
        DataType: dataDefine_1.Define.DataType.BOOL
    }),
    __metadata("design:type", Boolean)
], Person.prototype, "status", void 0);
__decorate([
    dataDefine_1.Define.Mapping({
        Mapping: 'Account',
        MappingKey: 'personId'
    }),
    __metadata("design:type", Array)
], Person.prototype, "accounts", void 0);
Person = __decorate([
    dataDefine_1.Define.Table({ TableName: "person" })
], Person);
exports.Person = Person;
//# sourceMappingURL=person.js.map