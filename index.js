// This bot was made with the assistance of Guidebot as a template, thank you to everyone
// who helped contribute to it. You can find it over at: https://github.com/AnIdiotsGuide/guidebot
// 
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
const { RefreshableAuthProvider, StaticAuthProvider } = require("twitch-auth");
const { PubSubClient } = require("twitch-pubsub-client");
const { WebHookListener } = require("twitch-webhooks");

// We also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const config = require("./config.js");


// This is your discordClient. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `discordClient.something`,
// or `bot.something`, this is what we're referring to. Your discordClient.
const discordClient = new Discord.Client({
  ws: {
    intents: config.intents
  }
});

// Here we load the config file that contains our token and our prefix values.
discordClient.config = config;

// discordClient.config.discordToken contains the bot's discord token
// discordClient.config.prefix contains the message prefix

const twitchTokens = require('./twitchtokens.js');
const { PubSubClient } = require("twitch-pubsub-client/lib");
const clientID = twitchTokens.config.clientID;
const clientSecret = twitchTokens.config.clientSecret;
const botName = twitchTokens.config.botName;
const channelName = twitchTokens.config.channelName;

discordClient.twitchTokens = new Enmap({name: "twitchTokens"});

// If an access token is not in the database, create it.
discordClient.twitchTokens.ensure(botName, {
  "accessToken": twitchTokens.config.botAccessToken,
  "refreshToken": twitchTokens.config.botRefreshToken,
  "expiryTimestamp": twitchTokens.config.expiryTimestamp
});
discordClient.twitchTokens.ensure(channelName, {
  "accessToken": twitchTokens.config.channelAccessToken,
  "refreshToken": twitchTokens.config.channelRefreshToken,
  "expiryTimestamp": twitchTokens.config.channelExpiryTimestamp
});

const botAccessToken = discordClient.twitchTokens.get(botName, "accessToken");
const botRefreshToken = discordClient.twitchTokens.get(botName, "refreshToken");
const botExpiryTimestamp = discordClient.twitchTokens.get(botName, "expiryTimestamp");
const channelAccessToken = discordClient.twitchTokens.get(channelName, "accessToken");
const channelRefreshToken = discordClient.twitchTokens.get(channelName, "refreshToken");
const channelExpiryTimestamp = discordClient.twitchTokens.get(channelName, "expiryTimestamp");

// Twitch Auth
const botAuth = new RefreshableAuthProvider(
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
      await discordClient.twitchTokens.set(botName, newTokenData);
    }
  }
);

const channelAuth = new RefreshableAuthProvider(
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
      await discordClient.twitchTokens.set(channelName, newTokenData);
    }
  }
);

const twitchClient = new ChatClient(botAuth, {
  channels: [channelName.toLowerCase()]
});

const apiClient = new ApiClient({ 
  authProvider: channelAuth
});

const pubSubClient = new PubSubClient();
apiClient.userId = await pubSubClient.registerUserListener(apiClient);

const twitchListener = new WebHookListener(apiClient)

twitchClient.channelAuth = channelAuth;

// Require our logger
discordClient.logger = require("./modules/Logger");
twitchClient.logger = require("./modules/Logger");

// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.
require("./modules/functions.js")(discordClient, twitchClient);

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
discordClient.commands = new Enmap();
discordClient.aliases = new Enmap();

twitchClient.commands = new Enmap();
twitchClient.aliases = new Enmap();

// Now we integrate the use of Evie's awesome EnMap module, which
// essentially saves a collection to disk. This is great for per-server configs,
// and makes things extremely easy for this purpose.
discordClient.settings = new Enmap({name: "settings"});
discordClient.userProfiles = new Enmap({name: "userProfiles"});

// Used for command cooldowns and in XP system.
discordClient.recentChatters = new Set();

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  const cmdFiles = await readdir("./commands/discord");
  discordClient.logger.log(`[DISCORD] Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = discordClient.loadCommand(f);
    if (response) console.log(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/discord");
  discordClient.logger.log(`[DISCORD] Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    if (!file.endsWith(".js")) return;
    const eventName = file.split(".")[0];
    discordClient.logger.log(`Loading Discord Event: ${eventName}`);
    const event = require(`./events/discord/${file}`);
    // Bind the discordClient to any event, before the existing arguments
    // provided by the discord.js event. 
    // This line is awesome by the way. Just sayin'.
    discordClient.on(eventName, event.bind(null, discordClient));
  });

  // Twitch commands and events
  const twitchCmdFiles = await readdir("./commands/twitch");
  twitchClient.logger.log(`[TWTICH] Loading a total of ${twitchCmdFiles} commands.`);
  twitchCmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = twitchClient.loadCommand(f);
    if (response) console.log(response);
  });


  // Generate a cache of discordClient permissions for pretty perm names in commands.
  discordClient.levelCache = {};
  for (let i = 0; i < discordClient.config.permLevels.length; i++) {
    const thisLevel = discordClient.config.permLevels[i];
    discordClient.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the clients.
  await discordClient.login(discordClient.config.discordToken);
  await twitchClient.connect();

  // Setup the event listener for Twitch.
  require("./events/twitch/chatListeners.js")(twitchClient, apiClient);
  
// End top-level async/await function.
};

init();
