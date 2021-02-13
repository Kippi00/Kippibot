// This event executes when a new guild (server) is left.

module.exports = (bot, guild) => {
  if (!guild.available) return; // If there is an outage, return.
  
  bot.logger.cmd(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);

  // If the settings Enmap contains any guild overrides, remove them.
  // No use keeping stale data!
  if (bot.discord.settings.has(guild.id)) {
    bot.discord.settings.delete(guild.id);
  }
};
