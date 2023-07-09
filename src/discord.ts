import Eris, { ApplicationCommandOptions, ApplicationCommandOptionsSubCommand, ApplicationCommandOptionsSubCommandGroup, Command, CommandInteraction, ComponentInteraction, Constants, Interaction, InteractionDataOptionsBoolean, InteractionDataOptionsInteger, InteractionDataOptionsNumber, InteractionDataOptionsString, InteractionDataOptionsSubCommand, InteractionDataOptionsUser } from "eris";
import { once, EventEmitter } from "events";
import { readFileFromURL } from "./util.js";
import config, { BotConfig } from "./config.js";
import db from "./db.js";
import { CollectorResetTimerOptions } from "discord.js";


const bot = Eris(config.botToken, {
    intents: ["guilds", "guildMessages"]
});

const permittedReacts: Record<string, string | boolean> = {};
 
interface BotEvents {
  //  newgiveaway: [interaction: CommandInteraction]
  //  setteams: [interaction: CommandInteraction, hometeam: string, awayteam: string, league: string, multiplier: number, duration: string, minimum_coins: number, maximum_coins: number, minimum_bottrades: number, maximum_bottrades: number];
  //  endmatch: [interaction: CommandInteraction, hometeam: boolean, draw: boolean, awayteam: boolean];
    //   vote: [interaction: CommandInteraction, hometeam: boolean, draw: boolean, awayteam: boolean, bet: string];
  //  match: [interaction: CommandInteraction];
  invite: [interaction: CommandInteraction, amount: number, packs: string[], username: string, coins: number];
  "admin-pay": [interaction: CommandInteraction, userId: string, coins: number, cards: string[], packs: string[], bottrades: number];
    remove: [interaction: CommandInteraction, userId: string, coins: number, cards: string[], packs: string[], bottrades: number];

  //  dailyspin: [interaction: CommandInteraction];
    "end-transaction": [interaction: CommandInteraction, userId: string];
   // code: [interaction: CommandInteraction, username: string, codename: string, duration: string];
    link: [interaction: CommandInteraction, username: string];
    viewlink: [interaction: CommandInteraction];
    unlink: [interaction: ComponentInteraction];
  //  level: [interaction: CommandInteraction];
  //  luckybox:[Interaction:CommandInteraction];
  //  boost: [interaction: CommandInteraction];
    send: [interaction: CommandInteraction, userId: string, cards: boolean, packs: boolean, coins: number, amount: number];
   // donator: [interaction: CommandInteraction];
  //  check: [interaction: CommandInteraction, userId: string];
    wallet: [interaction: CommandInteraction, userId: string, page: number];
    deposit: [interaction: CommandInteraction, multiple: boolean];
    withdraw: [interaction: CommandInteraction, coins: number, cards: string[], packs: string[], bottrades: number];
    pay: [interaction: CommandInteraction, userId: string, coins: number, cards: string[], packs: string[], bottrades: number];
    trade: [interaction: CommandInteraction, userId: string, givingCoins: number, givingCards: string[], givingPacks: string[], givingBotTrades: number, receivingCoins: number, receivingCards: string[], receivingPacks: string[], receivingBotTrades: number];
    flip: [interaction: CommandInteraction, coins: number, heads: boolean, userId?: string];
    invme: [interaction: CommandInteraction, coins: number, packs?: string[]];
    updatenames: [interaction: CommandInteraction, names: [string, string, string, string, string][]];
    freetrade: [interaction: CommandInteraction, amount: number, username?: string, userId?: string];
    setpacks: [interaction: CommandInteraction, packs: string[]];
    giveawayjoin: [interaction: ComponentInteraction, userId: string];
    email: [Interaction: CommandInteraction, email: string, username: string];
    "ga-forcestart": [interaction: CommandInteraction];
    "ga-forcestop": [interaction: CommandInteraction];
    "ga-announce": [interaction: CommandInteraction, start: string, duration?: string];
    "withdraw-all": [interaction: CommandInteraction];
    "end-transaction-me": [interaction: CommandInteraction];
}

interface IDiscordBot extends EventEmitter {
    on<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => void): this;
    once<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => void): this;
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean;

    setPermittedReact: (messageId: string, userId: string | boolean) => void;
    sendMessage(channelId: string, content: Eris.MessageContent): Promise<Eris.Message<Eris.TextableChannel>>
    editMessage(channelID: string, messageID: string, content: Eris.MessageContentEdit): Promise<Eris.Message<Eris.TextableChannel>>
    getReacts(message: Eris.Message<Eris.TextableChannel>, emoji: string): Promise<string[]>
    react(message: Eris.Message<Eris.TextableChannel>, emoji: string): Promise<void>

    config: BotConfig;
}

class DiscordBot extends EventEmitter {
    config: BotConfig;

    setPermittedReact(messageId: string, userId: string | boolean): void {
        permittedReacts[messageId] = userId;
    }
    constructor() {
        super();
        this.config = config;
    }

    sendMessage(channelId: string, content: Eris.MessageContent): Promise<Eris.Message<Eris.TextableChannel>> {
        return bot.createMessage(channelId, content);
    }

    editMessage(channelID: string, messageID: string, content: Eris.MessageContentEdit): Promise<Eris.Message<Eris.TextableChannel>> {
        return bot.editMessage(channelID, messageID, content);
    }

    getReacts(message: Eris.Message<Eris.TextableChannel>, emoji: string): Promise<string[]> {
        return new Promise(async (resolve) => {
            const res: string[] = [];
            let after: string | undefined;
            let added: number = 0;
            do {
                const users = await message.getReaction(emoji, after ? { after } : {});
                added = users.length;
                after = users[users.length - 1]?.id;
                res.push(...users.map(user => user.id));
            } while (added === 100);

            resolve(res);
        });
    }

    async react(message: Eris.Message<Eris.TextableChannel>, emoji: string): Promise<void> {
        return message.addReaction(emoji);
    }
}

const exportedBot: IDiscordBot = new DiscordBot() as IDiscordBot;

bot.on("error", (err) => {
    console.error("[DISCORD BOT ERROR]", err); // or your preferred logger
});


bot.connect();
await Promise.all([once(bot, "ready")]);

console.log("Discord connected");

// bot initialization start

bot.editStatus({
    name: "MADFUT",
    type: Constants.ActivityTypes.GAME,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
})

const linkCommand: ApplicationCommandOptionsSubCommand = {
    name: "link",
    description: "Links your Discord account to a MADFUT username",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "The MADFUT username you want to link your Discord account to. Omit to view your link status.",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
}

const newgiveawayCommand: ApplicationCommandOptionsSubCommand = {

    name: "giveaway",
    description: "[ADMIN ONLY] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,   
    
}
const emailCommand: ApplicationCommandOptionsSubCommand = {
    name: "email",
    description: "Add email",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "name",
            description: "Name of email",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "username",
            description: "Name of the account",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
}
const forceEndTransactionMeCommand: ApplicationCommandOptionsSubCommand = {
    name: "force-end-transaction-me",
    description: "[MODERATOR ONLY] :warning: Force ends your transaction :warning:",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}


const luckyboxCommand: ApplicationCommandOptionsSubCommand = {
    name: "luckybox",
    description: "open your lucky box",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const unlinkCommand: ApplicationCommandOptionsSubCommand = {
    name: "unlink",
    description: "Unlink your Discord account from the linked MADFUT username (if it is linked)",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const updateNamesCommand: ApplicationCommandOptionsSubCommand = {
    name: "un",
    description: "[ADMIN ONLY] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const freeTradeCommand: ApplicationCommandOptionsSubCommand = {
    name: "ft",
    description: "[ADMIN ONLY] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "a",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true
        },
        {
            name: "u",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "du",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        }
    ]
}

 const setPacksCommand: ApplicationCommandOptionsSubCommand = {
     name: "setpacks",
     description: "Set the packs of unlimited trades",
     type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
     options: [
         {
             name: "packs",
             description: "The packs you want to change to",
             type: Constants.ApplicationCommandOptionTypes.STRING,
             required: true
         }
     ]
 }

  const walletCommand: ApplicationCommandOptionsSubCommand = {
      name: "wallet",
      description: "Display your wallet",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
            name: "user",
            description: "The user you want to display the wallet from",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        },
          {
              name: "page",
              description: "The page you want to display",
              type: Constants.ApplicationCommandOptionTypes.INTEGER,
              required: false
          }
      ]
  }

  const levelCommand: ApplicationCommandOptionsSubCommand = {
    name: "level",
    description: "Claim your level rewards",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const boostCommand: ApplicationCommandOptionsSubCommand = {
    name: "boost",
    description: "Claim your boost rewards",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const donatorCommand: ApplicationCommandOptionsSubCommand = {
    name: "donator",
    description: "Claim your donator rewards",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const checkCommand: ApplicationCommandOptionsSubCommand = {
    name: "check",
    description: "Check which rewards a user have claimed",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to check his claimed rewards",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        }
    ]
}

 const depositCommand: ApplicationCommandOptionsSubCommand = {
     name: "deposit",
     description: "Deposit cards, packs or coins into your wallet",
     type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
     options: [
         {
             name: "multiple",
             description: "Whether you want to make multiple deposits in one go",
             type: Constants.ApplicationCommandOptionTypes.BOOLEAN
         }
     ]
 };

const withdrawAllCommand: ApplicationCommandOptionsSubCommand = {
    name: "withdraw-all",
    description: "Withdraw your entire wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

  const withdrawCommand: ApplicationCommandOptionsSubCommand = {
     name: "withdraw",
      description: "Withdraw cards, packs or coins from your wallet",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
          {
              name: "coins",
              description: "The amount of coins to withdraw from your wallet",
              type: Constants.ApplicationCommandOptionTypes.INTEGER,
              required: false
          },
          {
              name: "cards",
              description: "A comma-separated list of cards to withdraw from your wallet",
              type: Constants.ApplicationCommandOptionTypes.STRING,
              required: false
          },
          {
              name: "packs",
              description: "A comma-separated list of packs to withdraw from your wallet",
              type: Constants.ApplicationCommandOptionTypes.STRING,
              required: false
          },
          {
            name: "bottrades",
            description: "The amount of bot trades to withdraw from your wallet",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
      ]
  };

  const sendCommand: ApplicationCommandOptionsSubCommand = {
    name: "send",
    description: "[ADMIN ONLY] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "cards",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "packs",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "coins",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.NUMBER,
            required: true
        },
        {
            name: "amount",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.NUMBER,
            required: true
        }
    ]
}

const payCommand: ApplicationCommandOptionsSubCommand = {
    name: "pay",
    description: "Pay another user with cards, packs or coins from your wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to pay",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "coins",
            description: "The amount of coins to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A comma-separated list of cards to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A comma-separated list of packs to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "bottrades",
            description: "The amount of bot trades to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
    ]
}

const tradeCommand: ApplicationCommandOptionsSubCommand = {
    name: "trade",
    description: "Trade cards, packs or coins from your wallet with another user",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to trade with",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "givecoins",
            description: "The amount of coins you want to give",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "givecards",
            description: "A comma-separated list of cards you want to give",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "givepacks",
            description: "A comma-separated list of packs you want to give",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "givebottrades",
            description: "The amount of bot trades you want to give",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "receivecoins",
            description: "The amount of coins you want to receive",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "receivecards",
            description: "A comma-separated list of cards you want to receive",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "receivepacks",
            description: "A comma-separated list of packs you want to receive",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "receivebottrades",
            description: "The amount of bot trades you want to receive",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
    ]
}

const flipCommand: ApplicationCommandOptionsSubCommand = {
    name: "flip",
    description: "Flip a coin with another user for coins",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "coins",
            description: "The amount of coins you want to flip for",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true
        },
        {
            name: "side",
            description: "The side you pick",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            choices: [
                {
                    name: "Heads",
                    value: "heads"
                },
                {
                    name: "Tails",
                    value: "tails"
                }
            ],
            required: true
        },
        {
            name: "user",
            description: "The user you want to flip with. Omit to flip with anyone who accepts.",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        }
    ]
}

const invMeCommand: ApplicationCommandOptionsSubCommand = {
    name: "im",
    description: "🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "packs",
            description: "P",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "coins",
            description: "C",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
    ]
}

// const giveawayCommand: Eris.ApplicationCommandOptionsSubCommand[] = [
//     {
//         name: "ga-announce",
//         description: "[ADMIN ONLY] Announce a giveaway",
//         type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
//         options: [
//             {
//                 name: "start",
//                 description: "When to start the giveaway (minutes, relative)",
//                 type: Constants.ApplicationCommandOptionTypes.STRING,
//                 required: true
//             },
//             {
//                 name: "duration",
//                 description: "Duration of the giveaway (minutes)",
//                 type: Constants.ApplicationCommandOptionTypes.STRING,
//                 required: false
//             },
//         ]
//     },
//     // {
//     //     name: "ga-forcestart",
//     //     description: "[ADMIN ONLY] Force start a giveaway",
//     //     type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
//     // },
//     {
//         name: "ga-forcestop",
//         description: "[ADMIN ONLY] Force stop a giveaway",
//         type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
//     }
// ];

const forceEndTransactionCommand: ApplicationCommandOptionsSubCommand = {
    name: "force-end-transaction",
    description: "[MODERATOR ONLY] ⚠️ Force ends a user's transaction ⚠️",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user for whom to end the transaction",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        }
    ]
}

const adminRemoveCommand: ApplicationCommandOptionsSubCommand = {
    name: "nuke",
    description: "Put the specified coins or bot trades to remove from the specified user's wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to remove from",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "coins",
            description: "The amount of coins to remove from the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A card you want to remove",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A pack you want to remove",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
           name: "bottrades",
           description: "The amount of bot trades to remove from the other user",
           type: Constants.ApplicationCommandOptionTypes.INTEGER,
           required: false
       }
    ]
}

const codeCommand: ApplicationCommandOptionsSubCommand = {
    name: "code",
    description: "Generate a private invite code",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "The username that can use the code",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "codename",
            description: "The name of the code",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
           name: "duration",
           description: "The duration in minutes of the code will be active",
           type: Constants.ApplicationCommandOptionTypes.STRING,
           required: true
       }
    ]
}

const adminPayCommand: ApplicationCommandOptionsSubCommand = {
    name: "pay",
    description: "Put the specified cards, packs and coins into the specified user's wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to pay",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "coins",
            description: "The amount of coins to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A comma-separated list of ⚠️IDs of cards⚠️ to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A comma-separated list of ⚠️IDs of packs⚠️ to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
           name: "bottrades",
           description: "The amount of bot trades to pay to the other user",
           type: Constants.ApplicationCommandOptionTypes.INTEGER,
           required: false
       }
    ]
}

const matchCommand: ApplicationCommandOptionsSubCommand = {
    name: "match",
    description: "Claim your match rewards",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
}

const setTeamsCommand: ApplicationCommandOptionsSubCommand = {
    name: "setteams",
    description: "Set teams",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "hometeam",
            description: "The team you want to set as home",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "awayteam",
            description: "The team you want to set as away",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "league",
            description: "The league of the match",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "multiplier",
            description: "Multiplier of the rewards",
            type: Constants.ApplicationCommandOptionTypes.NUMBER,
            required: true
        },
        {
            name: "duration",
            description: "When to close predictions",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "minimum_coins",
            description: "Minimum amount",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "maximum_coins",
            description: "Maximum amount",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "minimum_bottrades",
            description: "Minimum amount",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "maximum_bottrades",
            description: "Maximum amount",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        
    ]
}

const voteCommand: ApplicationCommandOptionsSubCommand = {
    name: "vote",
    description: "Vote on which team should win",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "hometeam",
            description: "Vote on the home team",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "draw",
            description: "Vote as draw",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "awayteam",
            description: "Vote on the away tewam",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "bet",
            description: "Bet you want to set on this match",
            type: Constants.ApplicationCommandOptionTypes.NUMBER,
            required: true
        }
    ]
}

const endMatchCommand: ApplicationCommandOptionsSubCommand = {
    name: "endmatch",
    description: "End the match",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "hometeam",
            description: "Select home team as winner",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "draw",
            description: "Select draw",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
        {
            name: "awayteam",
            description: "Select away team as winner",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
            required: true
        },
    ]
}

const freeTradePackCommand: ApplicationCommandOptionsSubCommand = {
    name: "invite",
    description: "[ADMIN ONLY] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "a",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true
        },
        {
            name: "p",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "u",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        },
        {
            name: "c",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
    ]
}

const adminCommand: ApplicationCommandOptionsSubCommandGroup = {
    name: "admin",
    description: "[ADMIN ONLY] All admin commands",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    options: [
        //...giveawayCommand,
        setPacksCommand,
      //  newgiveawayCommand,
        freeTradeCommand,
        updateNamesCommand,
      //  setTeamsCommand,
       // endMatchCommand,
        freeTradePackCommand,
        adminPayCommand,
        adminRemoveCommand,
       // codeCommand,
        sendCommand
    ]
}

const moderatorCommand: ApplicationCommandOptionsSubCommandGroup = {
    name: "moderator",
    description: "[MODERATOR ONLY] All moderator commands",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    options: [
        invMeCommand,
        forceEndTransactionCommand
    ]
}

/*const claimCommand: ApplicationCommandOptionsSubCommandGroup = {
    name: "claim",
    description: "The claim commands",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    options: [
        levelCommand,
        boostCommand,
        checkCommand,
        donatorCommand,
        matchCommand
    ]
}
*/ 
const mainCommand: Eris.ApplicationCommandStructure = {
    name: "mf",
    description: "The main MADFUT bot command",
    options: [ 
        linkCommand,
        unlinkCommand,
      //  luckyboxCommand,
        walletCommand,
        depositCommand,
        withdrawCommand,
        payCommand,
        forceEndTransactionMeCommand,
        tradeCommand,
        flipCommand,
        moderatorCommand,
        adminCommand,
       // claimCommand,
      //  voteCommand,
        withdrawAllCommand,
       // emailCommand
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT
};

bot.createGuildCommand(config.guildId, mainCommand);

bot.createGuildCommand(config.guildId, {...mainCommand, name: "mf"});

async function confirm(interaction: CommandInteraction, id: string, message: string) {
    await interaction.createMessage({
        content: message,
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                    {
                        custom_id: id,
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.DANGER,
                        label: "Confirm"
                    }
                ]
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
}

function listenForMappingFile(interaction: CommandInteraction) {
    const channel = interaction.channel;
    let timeoutObj: NodeJS.Timeout;
    const msgListener = async (message: Eris.Message<Eris.PossiblyUncachedTextableChannel>) => {
        if (message.channel.id === channel.id && message.member && message.member.id === interaction.member!.id && message.attachments.length === 1) {
            clearTimeout(timeoutObj);
            bot.removeListener("messageCreate", msgListener);

            const res = await readFileFromURL(message.attachments[0].url, (line) => line.split("::") as [string, string, string, string, string]);
            exportedBot.emit("updatenames", interaction, res);
        }
    }

    timeoutObj = setTimeout(() => {
        bot.removeListener("messageCreate", msgListener);
        interaction.editOriginalMessage("Timed out waiting for mapping file.");
    }, 60000);

    bot.on("messageCreate", msgListener);
}

function handleAdminCommand(interaction: CommandInteraction) {

    if (!interaction.member?.roles.includes("1060225516923273270")){
        interaction.createMessage({
            content: "```Your not fucking admin dickhead```",
           
        });
        return;

    }

    const subcommand = interaction.data.options![0] as InteractionDataOptionsSubCommand;
    const subsubcmd = (subcommand.options![0] as InteractionDataOptionsSubCommand);
    const cmdName = subsubcmd.name;
                
    switch (cmdName) {
        case 'setteams':
            const hometeamstring: string = (subsubcmd.options!.find(option => option.name === 'hometeam') as InteractionDataOptionsString)?.value;
            const awayteamstring: string = (subsubcmd.options!.find(option => option.name === 'awayteam') as InteractionDataOptionsString)?.value;
            const leaguestring: string = (subsubcmd.options!.find(option => option.name === 'league') as InteractionDataOptionsString)?.value;
            const mincoinsstring: number = (subsubcmd.options!.find(option => option.name === 'minimum_coins') as InteractionDataOptionsNumber)?.value;
            const maxcoinsstring: number = (subsubcmd.options!.find(option => option.name === 'maximum_coins') as InteractionDataOptionsNumber)?.value;
            const minbottradesstring: number = (subsubcmd.options!.find(option => option.name === 'minimum_bottrades') as InteractionDataOptionsNumber)?.value;
            const maxbottradesstring: number = (subsubcmd.options!.find(option => option.name === 'maximum_bottrades') as InteractionDataOptionsNumber)?.value;
            const multiplierstring: number = (subsubcmd.options!.find(option => option.name === 'multiplier') as InteractionDataOptionsNumber)?.value;
            const duration: string = (subsubcmd.options!.find(option => option.name === 'duration') as InteractionDataOptionsString)?.value;

            if (mincoinsstring > 0 && maxcoinsstring > 0 && minbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select bot trades or coins, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && maxcoinsstring > 0 && maxbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select bot trades or coins, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (maxbottradesstring > 0 && maxcoinsstring > 0 && minbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select bot trades or coins, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && maxbottradesstring > 0 && minbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select bot trades or coins, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && maxbottradesstring > 0 && minbottradesstring > 0 && maxcoinsstring > 0) {
                return interaction.createMessage({
                    content: "You can only select bot trades or coins, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && !maxcoinsstring) {
                return interaction.createMessage({
                    content: "You must put a number in maximum coins!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (maxcoinsstring > 0 && !mincoinsstring) {
                return interaction.createMessage({
                    content: "You must put a number in minimum coins!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (minbottradesstring > 0 && !maxbottradesstring) {
                return interaction.createMessage({
                    content: "You must put a number in maximum bot trades!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (maxbottradesstring > 0 && !minbottradesstring) {
                return interaction.createMessage({
                    content: "You must put a number in maximum bot trades!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && minbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select coins or bot trades, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (maxcoinsstring > 0 && maxbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select coins or bot trades, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (maxcoinsstring > 0 && minbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select coins or bot trades, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            if (mincoinsstring > 0 && maxbottradesstring > 0) {
                return interaction.createMessage({
                    content: "You can only select coins or bot trades, not both!",
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }

            exportedBot.emit("setteams", interaction, hometeamstring, awayteamstring, leaguestring, multiplierstring, duration, mincoinsstring, maxcoinsstring, minbottradesstring, maxbottradesstring);
            break;
        case "endmatch" :
            const endhometeamstring: boolean = (subsubcmd.options!.find(option => option.name === 'hometeam') as InteractionDataOptionsBoolean)?.value;
            const endawayteamstring: boolean = (subsubcmd.options!.find(option => option.name === 'awayteam') as InteractionDataOptionsBoolean)?.value;
            const enddrawstring: boolean = (subsubcmd.options!.find(option => option.name === 'draw') as InteractionDataOptionsBoolean)?.value;

            if (endhometeamstring === true && endawayteamstring === true && enddrawstring === true) {
                interaction.createMessage("You can only set one option as true");
                break;
            }

            if (endhometeamstring === true && enddrawstring === true) {
                interaction.createMessage("You can only set one option as true");
                break;
            }

            if (endhometeamstring === true && endawayteamstring === true) {
                interaction.createMessage("You can only set one option as true");
                break;
            }

            if (endawayteamstring === true && enddrawstring === true) {
                interaction.createMessage("You can only set one option as true");
                break;
            }


            exportedBot.emit("endmatch", interaction, endhometeamstring, enddrawstring, endawayteamstring);
            break;
        case 'nuke': 
            const userremove = (subsubcmd.options![0] as InteractionDataOptionsUser).value;
            const removeCoins: number = (subsubcmd.options!.find(option => option.name === 'coins') as InteractionDataOptionsInteger)?.value ?? 0;
            const removeBotTrades: number = (subsubcmd.options!.find(option => option.name === 'bottrades') as InteractionDataOptionsInteger)?.value ?? 0;
            const removeCardsStr: string = (subsubcmd.options!.find(option => option.name === 'cards') as InteractionDataOptionsString)?.value ?? "";
            const removePacksStr: string = (subsubcmd.options!.find(option => option.name === 'packs') as InteractionDataOptionsString)?.value ?? "";

            const removeCards: string[] = removeCardsStr.split(",").filter(el => el.length);
            const removePacks: string[] = removePacksStr.split(".").filter(el => el.length);

           

            exportedBot.emit("remove", interaction, userremove, removeCoins, removeCards, removePacks, removeBotTrades);
            break;
            case "invite" :
                const inviteAmount = (subsubcmd.options?.find(option => option.name === 'a') as InteractionDataOptionsInteger)?.value;
                const madfutuser = (subsubcmd.options?.find(option => option.name === 'u') as InteractionDataOptionsString)?.value;
                const inviteCoins = (subsubcmd.options?.find(option => option.name === 'c') as InteractionDataOptionsInteger)?.value ?? 0;
                const invitePacks = (subsubcmd.options?.find(option => option.name === 'p') as InteractionDataOptionsString)?.value?.split(".").filter(el => el.length);
    
                exportedBot.emit("invite", interaction, inviteAmount, invitePacks, madfutuser, inviteCoins);
                break;
        case "code" :
                const codeUsername = (subsubcmd.options?.find(option => option.name === 'username') as InteractionDataOptionsString)?.value;
                const codeName = (subsubcmd.options?.find(option => option.name === 'codename') as InteractionDataOptionsString)?.value;
                const codeTime = (subsubcmd.options?.find(option => option.name === 'duration') as InteractionDataOptionsString)?.value;
    
                exportedBot.emit("code", interaction, codeUsername, codeName, codeTime);
                break;
                case 'giveaway':
                    exportedBot.emit("ga-announce", interaction,"0.2","1");
         
                     break;
                case "ga-forcestart":
                    exportedBot.emit("ga-forcestart", interaction);
                    break;
                case "ga-forcestop":
                    exportedBot.emit("ga-forcestop", interaction);
                    break;
                case "ga-announce":
                    exportedBot.emit("ga-announce", interaction, (subsubcmd.options![0] as InteractionDataOptionsString).value, (subsubcmd.options?.[1] as InteractionDataOptionsString)?.value ?? undefined);
                    break;
                case 'un':
                    interaction.createMessage("Send the mapping file within 1 minute.");
                    listenForMappingFile(interaction);
                    break;
                case 'ft':
                    exportedBot.emit("freetrade", interaction, (subsubcmd.options!.find(option => option.name === 'a') as InteractionDataOptionsInteger)!.value, (subsubcmd.options!.find(option => option.name === 'u') as InteractionDataOptionsString)?.value ?? undefined, (subsubcmd.options!.find(option => option.name === 'du') as InteractionDataOptionsString)?.value ?? undefined);
                    break;
                case 'setpacks':
                    exportedBot.emit("setpacks", interaction, (subsubcmd.options![0] as InteractionDataOptionsString).value.split(".").filter(el => el.length));
                    break;
                    case 'send' : {
                        if ((!interaction.member!.roles.includes(config.moderatorRoleId.toString()))) {
                            interaction.createMessage({
                                content: `Only high staff can use this command.`,
                                flags: Constants.MessageFlags.EPHEMERAL
                            });
                            return;
                        }
            
                        const userId = (subsubcmd.options!.find(option => option.name === 'username') as InteractionDataOptionsString).value;
                        const Cards: boolean = (subsubcmd.options!.find(option => option.name === 'cards') as InteractionDataOptionsBoolean)?.value;
                        const Packs: boolean = (subsubcmd.options!.find(option => option.name === 'packs') as InteractionDataOptionsBoolean)?.value;
                        const Coins: number = (subsubcmd.options!.find(option => option.name === 'coins') as InteractionDataOptionsNumber)?.value;
                        const Amount: number = (subsubcmd.options!.find(option => option.name === 'amount') as InteractionDataOptionsNumber)?.value;
            
            
                        exportedBot.emit("send", interaction, userId, Cards, Packs, Coins, Amount);
                        break;
                    }
                case 'pay': 
                    const user = (subsubcmd.options![0] as InteractionDataOptionsUser).value;
                    const payingCoins: number = (subsubcmd.options!.find(option => option.name === 'coins') as InteractionDataOptionsInteger)?.value ?? 0;
                    const payingBotTrades: number = (subsubcmd.options!.find(option => option.name === 'bottrades') as InteractionDataOptionsInteger)?.value ?? 0;
                    const payingCardsStr: string = (subsubcmd.options!.find(option => option.name === 'cards') as InteractionDataOptionsString)?.value ?? "";
                    const payingPacksStr: string = (subsubcmd.options!.find(option => option.name === 'packs') as InteractionDataOptionsString)?.value ?? "";
        
                    const payingCards: string[] = payingCardsStr.split(",").filter(el => el.length);
                    const payingPacks: string[] = payingPacksStr.split(".").filter(el => el.length);
        
                    if (payingCoins === 0 && payingCards.length === 0 && payingPacks.length === 0 && payingBotTrades === 0) {
                        interaction.createMessage("Input at least 1 item to pay.");
                        break;
                    }
        
                    exportedBot.emit("admin-pay", interaction, user, payingCoins, payingCards, payingPacks, payingBotTrades);
                    break;
            default:
            interaction.createMessage({
                content: `Unknown subcommand.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
            break;
    }
}

function handleModeratorCommand(interaction: CommandInteraction) {
    if (!(interaction.member!.roles.includes(config.moderatorRoleId))) {
        interaction.createMessage({
            content: `Only moderators can use this command.`,
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }

    const subcommand = interaction.data.options![0] as InteractionDataOptionsSubCommand;
    const subsubcmd = (subcommand.options![0] as InteractionDataOptionsSubCommand);
    const cmdName = subsubcmd.name;
                
    switch (cmdName) {
        case "im":
            const packs = (subsubcmd.options?.find(option => option.name === 'packs') as InteractionDataOptionsString)?.value?.split(".").filter(el => el.length) ?? undefined;
            const coins = (subsubcmd.options?.find(option => option.name === 'coins') as InteractionDataOptionsInteger)?.value ?? 10_000_000;

            exportedBot.emit("invme", interaction, coins, packs);
            break;
        case "force-end-transaction":
            exportedBot.emit("end-transaction", interaction, (subsubcmd.options![0] as InteractionDataOptionsUser).value);
            break;
        default:
            interaction.createMessage({
                content: `Unknown subcommand.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
            break;
    }
}

/*function handleClaimCommand(interaction: CommandInteraction) {
    const subcommand = interaction.data.options![0] as InteractionDataOptionsSubCommand;
    const subsubcmd = (subcommand.options![0] as InteractionDataOptionsSubCommand);
    const cmdName = subsubcmd.name;
                
    switch (cmdName) {
        case 'level':
                exportedBot.emit("level", interaction);
                break;
        case 'boost':
                exportedBot.emit("boost", interaction);
                break;
        case 'donator':
                exportedBot.emit("donator", interaction);
                break;
        case "check":
                exportedBot.emit("check", interaction, (subsubcmd.options![0] as InteractionDataOptionsUser)?.value ?? interaction.member?.id);
                break;
        case "match":
                if (!Adminchannel.includes(interaction.channel.id)) {
                interaction.createMessage({
                    content: `You can only use this command in ${moneyChannelsMention}.`,
                    flags: Constants.MessageFlags.EPHEMERAL
                });
            }
                exportedBot.emit("match", interaction);
            break;
        default:
            interaction.createMessage({
                content: `Unknown subcommand.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
            break;
    }
}
*/
const moneyChannels = [config.commandsChannelId, config.tradingChannelId];
const Adminchannel = [config.adminChannelId, config.commandsChannelId, config.tradingChannelId];
const moneyChannelsMention = `<#${moneyChannels[0]}> or <#${moneyChannels[1]}>`

bot.on("interactionCreate", (interaction) => {
    if (!(interaction as any).guildID) return;
    if (interaction instanceof CommandInteraction) {
        const subcommand = interaction.data.options![0] as InteractionDataOptionsSubCommand;
        switch (subcommand.name) {
         
            case 'link':
                if (interaction.channel.id !== config.commandsChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.commandsChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (subcommand.options) {
                    exportedBot.emit("link", interaction, (subcommand.options[0] as InteractionDataOptionsString)?.value ?? interaction.member!.id);
                } else {
                    exportedBot.emit("viewlink", interaction);
                }
                break;
            case 'unlink':
                if (interaction.channel.id !== config.commandsChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.commandsChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                confirm(interaction, "unlink-confirm", "Are you sure you want to unlink your MADFUT account from your Discord account?");
                break;
               
               
                case "luckybox":
                   
                if (interaction.channel.id !== config.commandsChannelId) {
                        interaction.createMessage({
                            content: `You can only use this command in the <#${config.commandsChannelId}> channel.`,
                            flags: Constants.MessageFlags.EPHEMERAL
                        });
                        break;
                    }

                exportedBot.emit("luckybox", interaction);
                break;


                case "email":
                    const name = (subcommand.options?.find(option => option.name === 'name') as InteractionDataOptionsString)?.value;
                    const username = (subcommand.options?.find(option => option.name === 'username') as InteractionDataOptionsString)?.value;
                    exportedBot.emit("email", interaction, name, username);
                    break;
            case 'admin':
                handleAdminCommand(interaction);
                break;
            case 'moderator':
                    handleModeratorCommand(interaction);
                    break;
            case 'claim':
                handleClaimCommand(interaction);
                break;
                case "dailyspin":
                    exportedBot.emit("dailyspin", interaction);
                break;
            case 'vote' : {
                if (!Adminchannel.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                }
                
                if (!subcommand.options) {
                    interaction.createMessage("Input at least a true option");
                    break;
                }

                const hometeam: boolean = (subcommand.options.find(option => option.name === 'hometeam') as InteractionDataOptionsBoolean)?.value;
                const draw: boolean = (subcommand.options.find(option => option.name === 'draw') as InteractionDataOptionsBoolean)?.value;
                const awayteam: boolean = (subcommand.options.find(option => option.name === 'awayteam') as InteractionDataOptionsBoolean)?.value;
                const bet: string = (subcommand.options.find(option => option.name === 'bet') as InteractionDataOptionsString)?.value;

                if (hometeam === true && awayteam === true && draw === true) {
                    interaction.createMessage({content: "You can only set one option as true", flags: Constants.MessageFlags.EPHEMERAL});
                    break;
                }

                if (hometeam === true && draw === true) {
                    interaction.createMessage({content: "You can only set one option as true", flags: Constants.MessageFlags.EPHEMERAL});
                    break;
                }

                if (hometeam === true && awayteam === true) {
                    interaction.createMessage({content: "You can only set one option as true", flags: Constants.MessageFlags.EPHEMERAL});
                    break;
                }

                if (awayteam === true && draw === true) {
                    interaction.createMessage({content: "You can only set one option as true", flags: Constants.MessageFlags.EPHEMERAL});
                    break;
                }

                exportedBot.emit("vote", interaction, hometeam, draw, awayteam, bet);
                break;
            }
            case 'wallet':
                if (!Adminchannel.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("wallet", interaction, (subcommand.options?.[0] as InteractionDataOptionsUser)?.value ?? interaction.member!.id, (subcommand.options?.[1] as InteractionDataOptionsInteger)?.value ?? 1);
                break;
            case 'deposit':
                if (!Adminchannel.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("deposit", interaction, (subcommand.options?.[0] as InteractionDataOptionsBoolean)?.value ?? false);
                break;
            case 'withdraw':
                if (!Adminchannel.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options) {
                    interaction.createMessage("Input at least 1 item to withdraw.");
                    break;
                }
                const wantedCoins: number = (subcommand.options.find(option => option.name === 'coins') as InteractionDataOptionsInteger)?.value ?? 0;
                const wantedBotTrades: number = (subcommand.options.find(option => option.name === 'bottrades') as InteractionDataOptionsInteger)?.value ?? 0;
                const wantedCardsStr: string = (subcommand.options.find(option => option.name === 'cards') as InteractionDataOptionsString)?.value ?? "";
                const wantedPacksStr: string = (subcommand.options.find(option => option.name === 'packs') as InteractionDataOptionsString)?.value ?? "";

                const wantedCards: string[] = wantedCardsStr.split(",").filter(el => el.length);
                const wantedPacks: string[] = wantedPacksStr.split(",").filter(el => el.length);

                if (wantedCoins === 0 && wantedCards.length === 0 && wantedPacks.length === 0 && wantedBotTrades === 0) {
                    interaction.createMessage("Input at least 1 item to withdraw.");
                    break;
                }

                exportedBot.emit("withdraw", interaction, wantedCoins, wantedCards, wantedPacks, wantedBotTrades);
            break;
            case 'pay': {
                if (interaction.channel.id !== config.tradingChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.tradingChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options || subcommand.options.length === 1) {
                    interaction.createMessage("Input at least 1 item to pay.");
                    break;
                }
                const user = (subcommand.options[0] as InteractionDataOptionsUser).value;
                const payingCoins: number = (subcommand.options.find(option => option.name === 'coins') as InteractionDataOptionsInteger)?.value ?? 0;
                const payingBotTrades: number = (subcommand.options.find(option => option.name === 'bottrades') as InteractionDataOptionsInteger)?.value ?? 0;
                const payingCardsStr: string = (subcommand.options.find(option => option.name === 'cards') as InteractionDataOptionsString)?.value ?? "";
                const payingPacksStr: string = (subcommand.options.find(option => option.name === 'packs') as InteractionDataOptionsString)?.value ?? "";

                const payingCards: string[] = payingCardsStr.split(",").filter(el => el.length);
                const payingPacks: string[] = payingPacksStr.split(",").filter(el => el.length);

                if (payingCoins === 0 && payingCards.length === 0 && payingPacks.length === 0 && payingBotTrades === 0) {
                    interaction.createMessage("Input at least 1 item to pay.");
                    break;
                }

                exportedBot.emit("pay", interaction, user, payingCoins, payingCards, payingPacks, payingBotTrades);
                break;
            }
            case "force-end-transaction-me":
                exportedBot.emit("end-transaction-me", interaction);
                break;
            case 'trade': {
                if (interaction.channel.id !== config.tradingChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.tradingChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options) {
                    interaction.createMessage("Input at least 1 item to give and 1 item to receive.");
                    break;
                }
                const user = (subcommand.options[0] as InteractionDataOptionsUser).value;

                const givingCoins: number = (subcommand.options.find(option => option.name === 'givecoins') as InteractionDataOptionsInteger)?.value ?? 0;
                const givingBotTrades: number = (subcommand.options.find(option => option.name === 'givebottrades') as InteractionDataOptionsInteger)?.value ?? 0;
                const givingCardsStr: string = (subcommand.options.find(option => option.name === 'givecards') as InteractionDataOptionsString)?.value ?? "";
                const givingPacksStr: string = (subcommand.options.find(option => option.name === 'givepacks') as InteractionDataOptionsString)?.value ?? "";

                const givingCards: string[] = givingCardsStr.split(",").filter(el => el.length);
                const givingPacks: string[] = givingPacksStr.split(",").filter(el => el.length);

                if (givingCoins === 0 && givingCards.length === 0 && givingPacks.length === 0 && givingBotTrades === 0) {
                    interaction.createMessage("Input at least 1 item to give.");
                    break;
                }

                const receivingCoins: number = (subcommand.options.find(option => option.name === 'receivecoins') as InteractionDataOptionsInteger)?.value ?? 0;
                const receivingBotTrades: number = (subcommand.options.find(option => option.name === 'receivebottrades') as InteractionDataOptionsInteger)?.value ?? 0;
                const receivingCardsStr: string = (subcommand.options.find(option => option.name === 'receivecards') as InteractionDataOptionsString)?.value ?? "";
                const receivingPacksStr: string = (subcommand.options.find(option => option.name === 'receivepacks') as InteractionDataOptionsString)?.value ?? "";

                const receivingCards: string[] = receivingCardsStr.split(",").filter(el => el.length);
                const receivingPacks: string[] = receivingPacksStr.split(",").filter(el => el.length);

                if (receivingCoins === 0 && receivingCards.length === 0 && receivingPacks.length === 0 && receivingBotTrades === 0) {
                    interaction.createMessage("Input at least 1 item to receive.");
                    break;
                }

                exportedBot.emit("trade", interaction, user, givingCoins, givingCards, givingPacks, givingBotTrades, receivingCoins, receivingCards, receivingPacks, receivingBotTrades);
                break;
            }
            case 'flip':
                if (interaction.channel.id !== config.coinFlipChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.coinFlipChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options) break;
                const coins: number = (subcommand.options[0] as InteractionDataOptionsInteger)?.value ?? 0;
                const heads: boolean = (subcommand.options[1] as InteractionDataOptionsString)?.value === "heads";
                const user: string | undefined = (subcommand.options?.[2] as InteractionDataOptionsUser)?.value ?? undefined;

                if (coins <= 0) {
                    interaction.createMessage("The amount of coins must be greater than 0.");
                    break;
                }

                exportedBot.emit("flip", interaction, coins, heads, user);
                break;
            case 'withdraw-all':
                if (!Adminchannel.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("withdraw-all", interaction);
                break;
            default:
                break;
        }
    } else if (interaction instanceof ComponentInteraction) {
        if (interaction.type === Constants.InteractionTypes.MESSAGE_COMPONENT) {
            switch(interaction.data.custom_id) {
                case "correct-packs":
                        if (interaction.message.interaction!.member!.id !== interaction.member!.id) {
                            interaction.createMessage({
                                content: `Only <@${interaction.message.interaction!.member!.id}> can use this buttons.`,
                                flags: Constants.MessageFlags.EPHEMERAL
                            });
                            break;
                        }
                        exportedBot.emit("invitepacks" + interaction.message.id as any, interaction, true);
                        break;
                case "wrong-packs":
                        if (interaction.message.interaction!.member!.id !== interaction.member!.id) {
                            interaction.createMessage({
                                content: `Only <@${interaction.message.interaction!.member!.id}> can use this buttons.`,
                                flags: Constants.MessageFlags.EPHEMERAL
                            });
                            break;
                        }
                        exportedBot.emit("invitepacks" + interaction.message.id as any, interaction, false);
                        break;
                case "unlink-confirm":
                    if (interaction.message.interaction!.member!.id !== interaction.member!.id) {
                        break;
                    }
                    exportedBot.emit("unlink", interaction);
                    break;
                case "trade-confirm":
                    if (!interaction.member!.id || (interaction.member!.id !== permittedReacts[interaction.message.id])) {
                        break;
                    }
                    exportedBot.emit("tradereact" + interaction.message.id as any, interaction, true);
                    break;
                case "trade-decline":
                    if (!interaction.member!.id || (interaction.member!.id !== permittedReacts[interaction.message.id])) {
                        break;
                    }
                    exportedBot.emit("tradereact" + interaction.message.id as any, interaction, false);
                    break;
                case "flip-confirm":
                    if (!interaction.member!.id || !(permittedReacts[interaction.message.id] === true || interaction.member!.id === permittedReacts[interaction.message.id])) {
                        break;
                    }
                    exportedBot.emit("flipreact" + interaction.message.id as any, interaction, true);
                    break;
                case "flip-decline":
                    if (!interaction.member!.id || (interaction.member!.id !== permittedReacts[interaction.message.id])) {
                        break;
                    }
                    exportedBot.emit("flipreact" + interaction.message.id as any, interaction, false);
                    break;
                case "giveaway-join":
                    exportedBot.emit("giveawayjoin", interaction, interaction.member!.id);
                    break;
                default:
                    break;
            }
        }
    }
});

// bot initialization end

export { exportedBot as bot }