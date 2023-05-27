export interface IButton {
    text: string,
    callback_data: string
}

export interface IUtils {
    getUserStatsText(telegramId: number | string): Promise<string>;
    getUsersText(): Promise<string>;
    getWhitelistText(): Promise<string>;
    getManageButtons(list: string): [ IButton[], IButton[], IButton[], IButton[]];
}