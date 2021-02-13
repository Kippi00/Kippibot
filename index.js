// This bot was made with the assistance of Guidebot as a template, thank you to everyone
// who helped contribute to it. You can find it over at: https://github.com/AnIdiotsGuide/guidebot
// 
// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 12) throw new Error("Node 12.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library
const Discord = require("discord.js");

// Twitch library
const { ApiClient } = require("twitch");
const { ChatClient } = require("twitch-chat-client");
const { RefreshableAuthProvider, StaticAuthProvider, ClientCredentialsAuthProvider } = require("twitch-auth");
const { PubSubClient } = require("twitch-pubsub-client");
//const { WebHookListener, ReverseProxyAdapter, SimpleAdapter } = require("twitch-webhooks");
const { NgrokAdapter } = require("twitch-webhooks-ngrok");
const { EventSubListener } = require("twitch-eventsub");

// We also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const config = require("./config.js");


// This is your discordClient. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `bot.discord.client.something`,
// or `bot.something`, this is what we're referring to. Your discordClient.
const bot = "";

bot.discord = "";
bot.twitch = "";

bot.discord.client = new Discord.Client({
  ws: {
    intents: config.intents
  }
});


// Here we load the config file that contains our token and our prefix values.
bot.config = config;

// bot.discord.config.discordToken contains the bot's discord token
// bot.discord.config.prefix contains the message prefix

const twitchTokens = require("./twitchtokens.js");
const clientID = twitchTokens.config.clientID;
const clientSecret = twitchTokens.config.clientSecret;
const botName = twitchTokens.config.botName;
const channelName = twitchTokens.config.channelName;

bot.twitch.tokens = new Enmap({name: "twitchTokens"});

// If an access token is not in the database, create it.
bot.twitch.tokens.ensure(botName, {
  "accessToken": twitchTokens.config.botAccessToken,
  "refreshToken": twitchTokens.config.botRefreshToken,
  "expiryTimestamp": twitchTokens.config.expiryTimestamp
});
bot.twitch.tokens.ensure(channelName, {
  "accessToken": twitchTokens.config.channelAccessToken,
  "refreshToken": twitchTokens.config.channelRefreshToken,
  "expiryTimestamp": twitchTokens.config.channelExpiryTimestamp
});

const botAccessToken = bot.twitch.tokens.get(botName, "accessToken");
const botRefreshToken = bot.twitch.tokens.get(botName, "refreshToken");
const botExpiryTimestamp = bot.twitch.tokens.get(botName, "expiryTimestamp");
const channelAccessToken = bot.twitch.tokens.get(channelName, "accessToken");
const channelRefreshToken = bot.twitch.tokens.get(channelName, "refreshToken");
const channelExpiryTimestamp = bot.twitch.tokens.get(channelName, "expiryTimestamp");

// Twitch Auth
bot.twitch.botAuth = new RefreshableAuthProvider(
  new StaticAuthProvider(clientID, botAccessToken), {
    clientSecret,
    refreshToken: botRefreshToken,
    expiry: botExpiryTimestamp === null ? null : new Date(botExpiryTimestamp),
    onRefresh: async ({ accessToken, refreshToken, expiryDate}) => {
      const newTokenData = {
        "accessToken": accessToken,
        "refreshToken": refreshToken,
        "expiryTimestamp": expiryDate === null ? null : expiryDate.getTime()
      };
      await bot.twitch.tokens.set(botName, newTokenData);
    }
  }
);

bot.twitch.channelAuth = new RefreshableAuthProvider(
  new StaticAuthProvider(clientID, channelAccessToken), {
    clientSecret,
    refreshToken: channelRefreshToken,
    expiry: channelExpiryTimestamp === null ? null : new Date(channelExpiryTimestamp),
    onRefresh: async ({ accessToken, refreshToken, expiryDate}) => {
      const newTokenData = {
        "accessToken": accessToken,
        "refreshToken": refreshToken,
        "expiryTimestamp": expiryDate === null ? null : expiryDate.getTime()
      };
      await bot.twitch.tokens.set(channelName, newTokenData);
    }
  }
);

bot.twitch.eventAuth = new ClientCredentialsAuthProvider(clientID, clientSecret);

bot.twitch.eventClient = new ApiClient({ 
  authProvider: bot.twitch.eventAuth 
});

bot.twitch.chatClient = new ChatClient(bot.twitch.botAuth, {
  channels: [channelName.toLowerCase()]
});

bot.twitch.apiClient = new ApiClient({ 
  authProvider: bot.twitch.channelAuth
});

// Require our logger
bot.logger = require("./modules/Logger");

// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.
require("./modules/functions.js")(bot);

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
bot.discord.commands = new Enmap();
bot.discord.aliases = new Enmap();

bot.twitch.commands = new Enmap();
bot.twitch.aliases = new Enmap();

// Now we integrate the use of Evie's awesome EnMap module, which
// essentially saves a collection to disk. This is great for per-server configs,
// and makes things extremely easy for this purpose.
bot.discord.settings = new Enmap({name: "settings"});
bot.discord.userProfiles = new Enmap({name: "userProfiles"});
bot.twitch.channels = new Enmap({name: "twitchChannels"});

// Used for command cooldowns and in XP system.
bot.discord.recentChatters = new Set();

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  const cmdFiles = await readdir("./commands/discord");
  bot.logger.log(`[DISCORD] Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = bot.discord.loadCommand(f);
    if (response) console.log(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/discord");
  bot.logger.log(`[DISCORD] Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    if (!file.endsWith(".js")) return;
    const eventName = file.split(".")[0];
    bot.logger.log(`Loading Discord Event: ${eventName}`);
    const event = require(`./events/discord/${file}`);
    // Bind the bot to any event, before the existing arguments
    // provided by the discord.js event. 
    // This line is awesome by the way. Just sayin'.
    bot.discord.client.on(eventName, event.bind(null, bot));
  });


  // Twitch commands and events
  /*
  const twitchCmdFiles = await readdir("./commands/twitch");
  bot.logger.log(`[TWTICH] Loading a total of ${twitchCmdFiles} commands.`);
  twitchCmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = bot.twitch.loadCommand(f);
    if (response) console.log(response);
  });*/

  // Twitch PubSub and EventSub setup

  bot.twitch.pubSubClient = new PubSubClient();
  bot.twitch.userId = await bot.twitch.pubSubClient.registerUserListener(bot.twitch.apiClient);

  bot.twitch.eventClient.listener = new EventSubListener(bot.twitch.eventClient, new NgrokAdapter());
  await bot.twitch.eventClient.listener.listen();

  // Twitch will not automatically clear our EventSub subscriptions, so we have to do that ourselves.
  // Otherwise, we will get duplicate subscriptions and get a 403 Forbidden Error for having 3 of the same type of subscriptions.
  await bot.twitch.eventClient.helix.eventSub.deleteAllSubscriptions();
  bot.logger.log("[TWITCH] Deleting all EventSub subscriptions, if they exist.");

  // Generate a cache of discordClient permissions for pretty perm names in commands.
  bot.discord.levelCache = {};
  for (let i = 0; i < bot.config.permLevels.length; i++) {
    const thisLevel = bot.config.permLevels[i];
    bot.discord.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the clients.
  await bot.discord.client.login(bot.config.discordToken);
  await bot.twitch.chatClient.connect();

  // Setup the event listener for Twitch.
  require("./events/twitch/chatListeners.js")(bot);
  require("./events/twitch/pubsubListeners.js")(bot);
  require("./events/twitch/eventSubListeners.js")(bot);
  //require("./events/twitch/webhookListeners")(twitchClient, apiClient, discordClient);
  
// End top-level async/await function.
};

init();
