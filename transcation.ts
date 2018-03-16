import { IDataContext } from ".";

export async function Transaction<T extends IDataContext, TResult>(ctx: T, action: (ctx: T) => Promise<TResult>): Promise<TResult> {
    ctx.BeginTranscation();
    try {
        let r = await action.call(this, ctx);
        await ctx.Commit();
        return r;
    } catch (error) {
        await ctx.RollBack();
        throw error;
    }
}