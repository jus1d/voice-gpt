import { Telegraf, Context } from "telegraf";
import { ConfigService } from "./config/config.service";
import { DatabaseService } from "./database/database.service";
import { Command } from "./commands/command.class";
import { IConfigService } from "./config/config.interface";
import { IDatabase } from "./database/database.interface";
import { StartCommand } from "./commands/start.command";

class Bot {
    bot: Telegraf<Context>;
    commands: Command[] = [];

    constructor(
        private readonly configService: IConfigService,
        private readonly databaseService: IDatabase
    ) {
        this.bot = new Telegraf<Context>(this.configService.get('telegram_token'));
    }

    async init() {
        await this.databaseService.init();
        this.commands = [
            new StartCommand(this.bot)
        ];
        for (const command of this.commands) {
            command.handle();
        }
        this.bot.launch();
    }
}

const config = new ConfigService();
const database = new DatabaseService();
const bot = new Bot(config, database);

bot.init();