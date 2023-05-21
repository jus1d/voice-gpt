import { Telegraf, Context } from 'telegraf';

export abstract class Event {
    constructor(public bot: Telegraf<Context>) {}

    abstract handle(): void;
}