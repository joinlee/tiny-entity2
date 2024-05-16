"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
async function Transaction(ctx, action) {
    ctx.BeginTranscation();
    try {
        let r = await action.call(this, ctx);
        await ctx.Commit();
        return r;
    }
    catch (error) {
        await ctx.RollBack();
        throw error;
    }
}
exports.Transaction = Transaction;
