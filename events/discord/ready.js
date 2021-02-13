module.exports = async bot => {
  // Log that the bot is online.
  const client = bot.discod.client;
  bot.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");

  // If default settings do not exist in Enmap yet, create them.
  await bot.discord.getSettings();

  // Make the bot "play the game" which is the help command with default prefix.
  client.user.setActivity(`${bot.discord.settings.get("default").prefix}help`, {type: "PLAYING"});
};
