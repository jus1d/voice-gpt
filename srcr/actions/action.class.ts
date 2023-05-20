import { Telegraf, Context } from 'telegraf';

export abstract class Action {
    constructor(public bot: Telegraf<Context>) {}

    abstract handle(): void;
}