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

// We also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const config = require("./config.js");
const { cmd } = require("./modules/Logger.js");

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`,
// or `bot.something`, this is what we're referring to. Your client.
const client = new Discord.Client({
  ws: {
    intents: config.intents
  }
});

// Here we load the config file that contains our token and our prefix values.
client.config = config;

// client.config.discordToken contains the bot's discord token
// client.config.prefix contains the message prefix

const twitchTokens = require('./twitchtokens.js');
const clientID = twitchTokens.config.clientID;
const clientSecret = twitchTokens.config.clientSecret;
const botName = twitchTokens.config.botName;
const channelName = twitchTokens.config.channelName;

client.twitchTokens = new Enmap({name: "twitchTokens"});

// If an access token is not in the database, create it.
client.twitchTokens.ensure(botName, {
  "accessToken": twitchTokens.config.botAccessToken,
  "refreshToken": twitchTokens.config.botRefreshToken,
  "expiryTimestamp": twitchTokens.config.expiryTimestamp
});
client.twitchTokens.ensure(channelName, {
  "accessToken": twitchTokens.config.channelAccessToken,
  "refreshToken": twitchTokens.config.channelRefreshToken,
  "expiryTimestamp": twitchTokens.config.channelExpiryTimestamp
});

const botAccessToken = client.twitchTokens.get(botName, "accessToken");
const botRefreshToken = client.twitchTokens.get(botName, "refreshToken");
const botExpiryTimestamp = client.twitchTokens.get(botName, "expiryTimestamp");
const channelAccessToken = client.twitchTokens.get(channelName, "accessToken");
const channelRefreshToken = client.twitchTokens.get(channelName, "refreshToken");
const channelExpiryTimestamp = client.twitchTokens.get(channelName, "expiryTimestamp");



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
      await client.twitchTokens.set(botName, newTokenData);
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
      await client.twitchTokens.set(channelName, newTokenData);
    }
  }
);

const chatClient = new ChatClient(botAuth, {
  channels: [channelName.toLowerCase()]
});

const apiClient = new ApiClient({ 
  authProvider: channelAuth
});

chatClient.channelAuth = channelAuth;

// Require our logger
client.logger = require("./modules/Logger");
chatClient.logger = require("./modules/Logger");

// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.
require("./modules/functions.js")(client);

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
client.discordCommands = new Enmap();
client.discordAliases = new Enmap();

// Now we integrate the use of Evie's awesome EnMap module, which
// essentially saves a collection to disk. This is great for per-server configs,
// and makes things extremely easy for this purpose.
client.settings = new Enmap({name: "settings"});
client.userProfiles = new Enmap({name: "userProfiles"});

// Used for command cooldowns and in XP system.
client.recentChatters = new Set();

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  const cmdFiles = await readdir("./commands/discord");
  client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = client.loadCommand(f, "discord");
    if (response) console.log(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/discord");
  client.logger.log(`Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    const eventName = file.split(".")[0];
    client.logger.log(`Loading Discord Event: ${eventName}`);
    const event = require(`./events/discord/${file}`);
    // Bind the client to any event, before the existing arguments
    // provided by the discord.js event. 
    // This line is awesome by the way. Just sayin'.
    client.on(eventName, event.bind(null, client));
  });

  // Generate a cache of client permissions for pretty perm names in commands.
  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the client.
  await client.login(client.config.discordToken);
  await chatClient.connect();
  
  chatClient.onJoin((channel, user) => {
    client.logger.log(`${user} is joining channel ${channel}`);
  });

  chatClient.onMessage(async (channel, user, message) => {
    if (message === 'foo') {
      chatClient.say(channel, 'bar');
    } else if (message === '!ping') {
      chatClient.say(channel, 'Pong!');
    } else if (message === '!title') {
      try {
        const user = await apiClient.helix.users.getUserByName(channel.slice(1));
        const id = user.id;
        const channelInfo = await apiClient.helix.channels.getChannelInfo(id);
        const title = channelInfo.title;
        chatClient.say(channel, `Status: ${title}`);
      } catch (e) {
        chatClient.logger.error(e);
        chatClient.say(channel, "Status: [API ERROR]");
      }
    } else if (message === '!testupdate') {
      try {
        const user = await apiClient.helix.users.getUserByName(channel.slice(1));
        const id = user.id;
        const data = {
          gameId: '33214',
          title: 'Testing the update command'
        };
        await apiClient.helix.channels.updateChannelInfo(id, data);
        chatClient.say(channel, `Status update: ${data.title} (Game: ${data.gameId})`);
      } catch (e) {
        chatClient.logger.error(e);
        chatClient.say(channel, "Error updating game.");
      }
    } else if (message === '!test') {
      const t = await apiClient.getTokenInfo();
      console.log(t.scopes);
    }
  });
// End top-level async/await function.
};

init();
