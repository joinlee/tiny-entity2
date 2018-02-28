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
const entityObjectMysql_1 = require("./../../mysql/entityObjectMysql");
const dataDefine_1 = require("../../define/dataDefine");
let Person = class Person extends entityObjectMysql_1.EntityObjectMysql {
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
    dataDefine_1.Define.Mapping({ Mapping: "Account" }),
    __metadata("design:type", Array)
], Person.prototype, "accounts", void 0);
Person = __decorate([
    dataDefine_1.Define.Table({ TableName: "person" })
], Person);
exports.Person = Person;
//# sourceMappingURL=person.js.map