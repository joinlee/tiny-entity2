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
exports.DeskTable = void 0;
const dataDefine_1 = require("../../define/dataDefine");
const entityObjectFactory_1 = require("../../entityObjectFactory");
const EntityObjectType = entityObjectFactory_1.EntityObjectFactory.GetEntityObjectType('mysql');
let DeskTable = class DeskTable extends EntityObjectType {
};
__decorate([
    dataDefine_1.Define.PrimaryKey(),
    __metadata("design:type", String)
], DeskTable.prototype, "id", void 0);
__decorate([
    dataDefine_1.Define.Column(),
    __metadata("design:type", String)
], DeskTable.prototype, "name", void 0);
__decorate([
    dataDefine_1.Define.Column({ DefaultValue: "opening", DataType: dataDefine_1.Define.DataType.VARCHAR }),
    __metadata("design:type", String)
], DeskTable.prototype, "status", void 0);
DeskTable = __decorate([
    dataDefine_1.Define.Table({ TableName: "desktable" })
], DeskTable);
exports.DeskTable = DeskTable;
