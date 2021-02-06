module.exports = async discordClient => {
  // Log that the bot is online.
  discordClient.logger.log(`${discordClient.user.tag}, ready to serve ${discordClient.users.cache.size} users in ${discordClient.guilds.cache.size} servers.`, "ready");

  // If default settings do not exist in Enmap yetpm, create them.
  await discordClient.getSettings();

  // Make the bot "play the game" which is the help command with default prefix.
  discordClient.user.setActivity(`${discordClient.settings.get("default").prefix}help`, {type: "PLAYING"});
};
