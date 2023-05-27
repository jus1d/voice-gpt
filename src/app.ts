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
import { ManageAction } from "./events/actions/manage.action";
import { DatabaseService } from "./database/database.service";
import { IConfigService } from "./config/config.interface";
import { NewCommand } from "./events/commands/new.command";
import { IDatabase } from "./database/database.interface";
import { NoneAction } from "./events/actions/none.action";
import { PlugAction } from "./events/actions/plug.action";
import { IdCommand } from "./events/commands/id.command";
import { ConfigService } from "./config/config.service";
import { IVoiceService } from "./voice/voice.interface";
import { VoiceMessage } from "./events/voice.message";
import { VoiceService } from "./voice/voice.service";
import { UtilsService } from "./utils/utils.service";
import { TextMessage } from "./events/text.message";
import { IOpenAI } from "./openai/openai.interface";
import { OpenAI } from "./openai/openai.service";
import { IUtils } from "./utils/utils.interface";
import { Event } from "./events/event.class";
import { Telegraf, Context } from "telegraf";
import signale from "signale";
import fs from 'fs';

signale.config({
    displayTimestamp: true,
    displayDate: false,
    displayFilename: false,
});

class Bot {
    bot: Telegraf<Context>;
    events: Event[] = [];

    constructor(
        private readonly configService: IConfigService,
        private readonly databaseService: IDatabase,
        private readonly openaiService: IOpenAI,
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
            new StartCommand(this.bot, this.databaseService, this.configService, this.utilsService),
            new IdCommand(this.bot),
            new AboutCommand(this.bot),
            new NewCommand(this.bot, this.databaseService,),
            new ManageCommand(this.bot, this.databaseService, this.utilsService),
            new UsersCommand(this.bot, this.databaseService, this.utilsService),
            new WhitelistCommand(this.bot, this.databaseService, this.utilsService),
            new ConversationCommand(this.bot, this.databaseService, this.openaiService),
            new ConversationAction(this.bot, this.databaseService),
            new BackToUsersAction(this.bot, this.databaseService, this.utilsService),
            new BlacklistAction(this.bot, this.databaseService, this.utilsService),
            new LimitedAction(this.bot, this.databaseService, this.utilsService),
            new NoneAction(this.bot, this.databaseService, this.utilsService),
            new PlugAction(this.bot),
            new RequestAccessAction(this.bot, this.databaseService, this.configService),
            new ResetFreeRequestsAction(this.bot, this.databaseService, this.utilsService),
            new UpdateStatsAction(this.bot, this.databaseService, this.utilsService),
            new WhitelistAction(this.bot, this.databaseService, this.utilsService),
            new ManageAction(this.bot, this.databaseService, this.utilsService),
            new TextMessage(this.bot, this.databaseService, this.openaiService),
            new VoiceMessage(this.bot, this.databaseService, this.openaiService, this.voiceService),
        ];
        for (const event of this.events) {
            event.handle();
        }
        this.bot.launch();
        signale.info(`VoiceGPT:${TYPE} v${packageFile.version} just started`);
        
        if (TYPE === 'prod') {
            this.bot.telegram.sendMessage(
                this.configService.get('admin_tg_id'), 
                `<b>🚨 VoiceGPT:${TYPE} v${packageFile.version} just started</b>`, 
                { parse_mode: 'HTML' });
        }

        process.once('SIGINT', () => {
            this.bot.telegram.sendMessage(this.configService.get('admin_tg_id'), '<b>🚨 Bot stopped: SIGINT</b>', {
                parse_mode: 'HTML'
            });
            this.bot.stop('SIGINT');
            signale.warn('Bot stopped: SIGINT');
        });

        process.once('SIGTERM', () => {
            this.bot.telegram.sendMessage(this.configService.get('admin_tg_id'), '<b>🚨 Bot stopped: SIGTERM</b>', {
                parse_mode: 'HTML'
            });
            this.bot.stop('SIGTERM');
            signale.warn('Bot stopped: SIGTERM');
        });
    }
}

console.clear();

const configService = new ConfigService();
const databaseService = new DatabaseService(configService);
const utilsService = new UtilsService(databaseService);
const voiceService = new VoiceService();
const openaiService = new OpenAI(configService.get('openai_token'), voiceService);

const bot = new Bot(configService, databaseService, openaiService, voiceService, utilsService);

bot.init();