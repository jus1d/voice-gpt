import { ResetFreeRequestsAction } from "./events/actions/resetFreeRequests.action";
import { ConversationCommand } from "./events/commands/conversation.command";
import { RequestAccessAction } from "./events/actions/requestAccess.action";
import { ConversationAction } from "./events/actions/conversation.action";
import { UpdateStatsAction } from "./events/actions/updateStats.action";
import { BackToUsersAction } from "./events/actions/backToUsers.action";
import { WhitelistCommand } from "./events/commands/whitelist.command";
import { WhitelistAction } from "./events/actions/whitelist.action";
import { BlacklistAction } from "./events/actions/blacklist.action";
import { ManageCommand } from "./events/commands/manage.command";
import { LimitedAction } from "./events/actions/limited.action";
import { StartCommand } from "./events/commands/start.command";
import { UsersCommand } from "./events/commands/users.command";
import { AboutCommand } from "./events/commands/about.command";
import { DatabaseService } from "./database/database.service";
import { IConfigService } from "./config/config.interface";
import { NewCommand } from "./events/commands/new.command";
import { IDatabase } from "./database/database.interface";
import { NoneAction } from "./events/actions/none.action";
import { PlugAction } from "./events/actions/plug.action";
import { IdCommand } from "./events/commands/id.command";
import { ConfigService } from "./config/config.service";
import { LoggerService } from "./logger/logger.service";
import { IVoiceService } from "./voice/voice.interface";
import { VoiceMessage } from "./events/voice.message";
import { VoiceService } from "./voice/voice.service";
import { UtilsService } from "./utils/utils.service";
import { TextMessage } from "./events/text.message";
import { IOpenAI } from "./openai/openai.interface";
import { ILogger } from "./logger/logger.interface";
import { OpenAI } from "./openai/openai.service";
import { IUtils } from "./utils/utils.interface";
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
            new StartCommand(this.bot, this.databaseService, this.loggerService, this.configService, this.utilsService),
            new IdCommand(this.bot),
            new AboutCommand(this.bot),
            new NewCommand(this.bot, this.databaseService, this.loggerService),
            new ManageCommand(this.bot, this.databaseService, this.utilsService),
            new UsersCommand(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new WhitelistCommand(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new ConversationCommand(this.bot, this.databaseService, this.openaiService),
            new ConversationAction(this.bot, this.databaseService),
            new BackToUsersAction(this.bot, this.databaseService, this.utilsService),
            new BlacklistAction(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new LimitedAction(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new NoneAction(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new PlugAction(this.bot),
            new RequestAccessAction(this.bot, this.databaseService, this.configService, this.loggerService),
            new ResetFreeRequestsAction(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new UpdateStatsAction(this.bot, this.databaseService, this.utilsService),
            new WhitelistAction(this.bot, this.databaseService, this.loggerService, this.utilsService),
            new TextMessage(this.bot, this.databaseService, this.openaiService, this.loggerService),
            new VoiceMessage(this.bot, this.databaseService, this.openaiService, this.loggerService, this.voiceService),
        ];
        for (const event of this.events) {
            event.handle();
        }
        this.bot.launch();
        this.loggerService.start(TYPE, packageFile.version);
        
        if (TYPE === 'prod') this.bot.telegram.sendMessage(
            this.configService.get('admin_tg_id'), 
            `<b><code>VoiceGPT:${TYPE} v${packageFile.version} just started</code></b>`, 
            { parse_mode: 'HTML' });

        process.once('SIGINT', () => {
            this.bot.stop('SIGINT');
            this.loggerService.info('Bot stopped: SIGINT', false);
        });

        process.once('SIGTERM', () => {
            this.bot.stop('SIGTERM');
            this.loggerService.info('Bot stopped: SIGTERM', false);
        });
    }
}

const configService = new ConfigService();
const loggerService = new LoggerService();
const databaseService = new DatabaseService(configService, loggerService);
const utilsService = new UtilsService(databaseService);
const voiceService = new VoiceService(loggerService);
const openaiService = new OpenAI(configService.get('openai_token'), voiceService, loggerService);

const bot = new Bot(configService, databaseService, openaiService, loggerService, voiceService, utilsService);

bot.init();