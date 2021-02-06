exports.run = async (discordClient, message, args, level) => { // eslint-disable-line no-unused-vars
  await message.reply("Bot is restarting.");
  await Promise.all(discordClient.commands.map(cmd =>
    discordClient.unloadCommand(cmd)
  ));
  process.exit(0);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "Bot Admin"
};

exports.help = {
  name: "reboot",
  category: "System",
  description: "Shuts down the bot. If running under PM2, bot will restart automatically.",
  usage: "reboot"
};