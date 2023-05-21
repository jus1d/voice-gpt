import { DatabaseService } from "./database/database.service";
import { IConfigService } from "./config/config.interface";
import { IDatabase } from "./database/database.interface";
import { ConfigService } from "./config/config.service";
import { LoggerService } from "./logger/logger.service";
import { IVoiceService } from "./voice/voice.interface";
import { StartCommand } from "./events/start.command";
import { VoiceMessage } from "./events/voice.message";
import { AboutCommand } from "./events/about.command";
import { VoiceService } from "./voice/voice.service";
import { UtilsService } from "./utils/utils.service";
import { TextMessage } from "./events/text.message";
import { IOpenAI } from "./openai/openai.interface";
import { ILogger } from "./logger/logger.interface";
import { NewCommand } from "./events/new.command";
import { OpenAI } from "./openai/openai.service";
import { IUtils } from "./utils/utils.interface";
import { IdCommand } from "./events/id.command";
import { Event } from "./events/event.class";
import { Telegraf, Context } from "telegraf";
import fs from 'fs';

class Bot {
    bot: Telegraf<Context>;
    events: Event[] = [];

    
    constructor(
        private readonly configService: IConfigService,
        private readonly databaseService: IDatabase,
        private readonly openaiService: IOpenAI,
        private readonly loggerService: ILogger,
        private readonly voiceService: IVoiceService,
        private readonly utilsService: IUtils
    ) {
        this.bot = new Telegraf<Context>(this.configService.get('telegram_token'));
    }

    async init() {
        const TYPE: string = this.configService.get('type');
        const packageFile = JSON.parse(fs.readFileSync('package.json').toString());

        await this.databaseService.init();
        this.events = [
            new StartCommand(this.bot, this.databaseService, this.loggerService),
            new IdCommand(this.bot),
            new AboutCommand(this.bot),
            new NewCommand(this.bot, this.databaseService, this.loggerService),
            new TextMessage(this.bot, this.databaseService, this.openaiService, this.loggerService),
            new VoiceMessage(this.bot, this.databaseService, this.openaiService, this.loggerService, this.voiceService),
        ];
        for (const event of this.events) {
            event.handle();
        }
        this.bot.launch();
        this.loggerService.start(TYPE, packageFile.version);
    }
}

const configService = new ConfigService();
const loggerService = new LoggerService();
const database = new DatabaseService(configService, loggerService);
const utilsService = new UtilsService(database);
const voiceService = new VoiceService(loggerService);
const openaiService = new OpenAI(configService.get('openai_token'), voiceService, loggerService);

const bot = new Bot(configService, database, openaiService, loggerService, voiceService, utilsService);

bot.init();