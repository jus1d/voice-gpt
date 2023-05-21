import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";
import fs from 'fs';

export class AboutCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    packageFile = JSON.parse(fs.readFileSync('package.json').toString());

    handle(): void {
        this.bot.command('about', async (ctx) => {
            ctx.replyWithHTML(`<b>About VoiceGPT:\n\n</b>` + 
                `<b>Version:</b> ${this.packageFile.version}\n` + 
                `<b>Developer, admin:</b> @jus1d\n` + 
                `<b>Contact email:</b> mejus1d@gmail.com`);
        });
    }
}