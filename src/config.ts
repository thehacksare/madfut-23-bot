import { readFile, writeFile } from "fs/promises";

export type BotConfig = {
    botToken: string,
    guildId: string,
    guildIdSupport: string,
    adminChannelId: string,
    moderatorRoleId: string,
    freetradeRoleId: string,
    tradingChannelId: string,
    coinFlipChannelId: string,
    commandsChannelId: string,
    giveawayPingRoleId: string,
    logChannelId: string,
    matchAnnouncementLogChannelId: string,
    predictionLogChannelId: string,
    BetRoleId: string,
    freetradeLogChannelId: string,
    appCheckToken: string,
    madfutEmail: string,
    madfutPassword: string,
    shoppySecret: string,
    shopLogChannelId: string
}

const config: BotConfig = JSON.parse((await readFile("config.json")).toString());

function saveConfig() {
    return writeFile("config.json", JSON.stringify(config));
}

export default config;

export { saveConfig }