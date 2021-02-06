// This event executes when a new guild (server) is left.

module.exports = (discordClient, guild) => {
  if (!guild.available) return; // If there is an outage, return.
  
  discordClient.logger.cmd(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);

  // If the settings Enmap contains any guild overrides, remove them.
  // No use keeping stale data!
  if (discordClient.settings.has(guild.id)) {
    discordClient.settings.delete(guild.id);
  }
};
