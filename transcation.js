"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function Transaction(ctx) {
    return (target, propertyName, descriptor) => {
        let method = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.ctx) {
                    this.ctx = ctx;
                }
                this.ctx.BeginTranscation();
                let result;
                try {
                    result = yield method.apply(this, arguments);
                    let r = yield this.ctx.Commit();
                    if (r === true) {
                        this.ctx = null;
                    }
                    return result;
                }
                catch (error) {
                    if (this.ctx) {
                        yield this.ctx.RollBack();
                        this.ctx = null;
                    }
                    throw error;
                }
            });
        };
    };
}
exports.Transaction = Transaction;
//# sourceMappingURL=transcation.js.map