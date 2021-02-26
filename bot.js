// Discord.js library 
const Discord = require("discord.js");

// Twitch-JS library
const { ApiClient } = require("twitch");
const { ChatClient } = require("twitch-chat-client");
const { RefreshableAuthProvider, StaticAuthProvider, ClientCredentialsAuthProvider } = require("twitch-auth");
const { PubSubClient } = require("twitch-pubsub-client");
const { NgrokAdapter } = require("twitch-webhooks-ngrok");
const { EventSubListener } = require("twitch-eventsub");

// Everything else needed
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
//const { debug } = require("./modules/Logger");

const twitchTokens =  new Enmap({name: "twitchTokens"});

class Bot {
  constructor(config) {
    this.config = config;

    this.discord = new Discord.Client({
      ws: config.intents
    });

    this.twitch = config.twitch;

    this.twitch.tokens = twitchTokens;

    const twitchBot = this.twitch.bot;
    const twitchChannel = this.twitch.streamer;

    this.twitch.tokens.ensure(twitchBot.name, {
      botName: twitchBot.name,
      id: null,
      accessToken: twitchBot.accessToken,
      refreshToken: twitchBot.refreshToken,
      expiryTimestamp: twitchBot.expiryTimestamp
    });

    this.twitch.tokens.ensure(twitchChannel.name, {
      channelName: twitchChannel.name,
      id: null,
      accessToken: twitchChannel.accessToken
    });

    const twitchBotTokens = this.twitch.tokens.get(twitchBot.name);
    const twitchChannelTokens = this.twitch.tokens.get(twitchChannel.name);

    const twitchBotAuth = new RefreshableAuthProvider(
      new StaticAuthProvider(twitchBot.clientID, twitchBotTokens.accessToken), {
        clientSecret: this.twitch.clientSecret,
        refreshToken: twitchBotTokens.refreshToken,
        expiry: twitchBotTokens.expiryTimestamp === null ? null : new Date(twitchBotTokens.expiryTimestamp),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
          const newTokenData = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiryTimestamp: expiryDate
          };
          await this.twitch.tokens.update(twitchBotTokens, newTokenData);
        }
      }
    );

    const twitchChannelAuth = new RefreshableAuthProvider(
      new StaticAuthProvider(twitchBot.clientID, twitchChannelTokens.accessToken), {
        clientSecret: this.twitch.clientSecret,
        refreshToken: twitchBotTokens.refreshToken,
        expiry: twitchBotTokens.expiryTimestamp === null ? null : new Date(twitchBotTokens.expiryTimestamp),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
          const newTokenData = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiryTimestamp: expiryDate
          };
          await this.twitch.tokens.update(twitchChannelTokens, newTokenData);
        }
      }
    );

    const twitchEventAuth = new ClientCredentialsAuthProvider(this.twitch.clientID, this.twitch.clientSecret);

    this.twitch.chatClient = ""

    // Channel ApiClient
    this.twitch.apiClient = new ApiClient({
      authProvider: twitchChannelAuth
    }); 

    // EventSub ApiClient
    this.twitch.eventClient = new ApiClient({
      authProvider: twitchEventAuth
    });

    this.discord.commands = new Enmap();
    this.discord.aliases = new Enmap ();
    this.discord.settings = new Enmap({name: "settings"});
    this.discord.userProfiles = new Enmap({name: "userProfiles"});
    this.discord.recentChatters = new Set();
    
    this.twitch.commands = new Enmap();
    this.twitch.aliases = new Enmap();
    this.twitch.channels = new Enmap();

    this.logger = require("./modules/Logger");

    require("./modules/functions.js")(this);

    const init = async () => {
      const discordCmdFiles = await readdir("./commands/discord");
      this.logger.log(`[DISCORD] Loading a total of ${discordCmdFiles.length} commands`);
      discordCmdFiles.forEach(f => {
        if (!f.endsWith(".js")) return;
        const response = this.discord.loadCommand(f);
        if (response) bot.logger.warn(response);
      });
      const eventFiles = await readdir("./events/discord");
      this.logger.log(``)
    };

    

    init();
  }

}
