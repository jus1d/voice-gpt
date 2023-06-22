import { Telegraf, Context } from 'telegraf';

export abstract class Event {
    protected constructor(public bot: Telegraf<Context>) {}

    abstract handle(): void;
}