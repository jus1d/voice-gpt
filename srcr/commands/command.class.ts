import { Telegraf, Context } from 'telegraf';

export abstract class Command {
    constructor(public bot: Telegraf<Context>) {}

    abstract handle(): void;
}