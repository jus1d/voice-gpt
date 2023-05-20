import { Telegraf, Context } from "telegraf";
import { ConfigService } from "./config/config.service";
import { DatabaseService } from "./database/database.service";
import { Event } from "./events/event.class";
import { IConfigService } from "./config/config.interface";
import { IDatabase } from "./database/database.interface";
import { StartCommand } from "./events/start.command";

class Bot {
    bot: Telegraf<Context>;
    events: Event[] = [];

    constructor(
        private readonly configService: IConfigService,
        private readonly databaseService: IDatabase
    ) {
        this.bot = new Telegraf<Context>(this.configService.get('telegram_token'));
    }

    async init() {
        await this.databaseService.init();
        this.events = [
            new StartCommand(this.bot, this.databaseService)
        ];
        for (const event of this.events) {
            event.handle();
        }
        this.bot.launch();
        console.log('started');
    }
}

const config = new ConfigService();
const database = new DatabaseService();
const bot = new Bot(config, database);

bot.init();