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
exports.Users = void 0;
const dataDefine_1 = require("../../define/dataDefine");
const entityObjectFactory_1 = require("../../entityObjectFactory");
const EntityObjectType = entityObjectFactory_1.EntityObjectFactory.GetEntityObjectType('mysql');
let Users = class Users extends EntityObjectType {
};
__decorate([
    dataDefine_1.Define.PrimaryKey(),
    __metadata("design:type", String)
], Users.prototype, "id", void 0);
__decorate([
    dataDefine_1.Define.Column({ DataType: dataDefine_1.Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 }),
    __metadata("design:type", Number)
], Users.prototype, "amountDue", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", Object)
], Users.prototype, "cart", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", Object)
], Users.prototype, "cashier", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", Object)
], Users.prototype, "checkout", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", String)
], Users.prototype, "checkoutMode", void 0);
__decorate([
    dataDefine_1.Define.Column({ DataType: dataDefine_1.Define.DataType.BIGINT }),
    __metadata("design:type", Number)
], Users.prototype, "closeTime", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", Number)
], Users.prototype, "createTime", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", Object)
], Users.prototype, "creator", void 0);
Users = __decorate([
    dataDefine_1.Define.Table({ TableName: "users" })
], Users);
exports.Users = Users;
//# sourceMappingURL=user.js.map