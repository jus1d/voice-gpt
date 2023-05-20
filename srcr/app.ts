import { Telegraf, Context } from "telegraf";
import { ConfigService } from "./config/config.service";
import { DatabaseService } from "./database/database.service";
import { Event } from "./events/event.class";
import { IConfigService } from "./config/config.interface";
import { IDatabase } from "./database/database.interface";
import { StartCommand } from "./events/start.command";
import { LoggerService } from "./logger/logger.service";
import { OpenAI } from "./openai/openai.service";
import { VoiceService } from "./voice/voice.service";

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

const configService = new ConfigService();
const loggerService = new LoggerService();
const voiceService = new VoiceService(loggerService);
const openaiService = new OpenAI(configService.get('openai_token'), voiceService, loggerService);
const database = new DatabaseService(configService, loggerService);
const bot = new Bot(configService, database);

bot.init();