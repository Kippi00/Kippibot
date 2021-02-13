// Variables
// {{channel}} = Twitch channel
// {{url}} = Twitch url
// {{game}} = Twitch game
// {{title}} = Twitch tile

module.exports = async (client, message, args, bot) => {
  const eventClient = bot.twitch.eventClient;
  if (!args[2]) return message.reply("You must specify a channel to add.");
  const user = await eventClient.helix.users.getUserByName(args[2]);
  if (!user) {
    message.react("❌");
    return message.channel.send("Twitch channel not found. Did you misspell it?");
  } 
  let discordChannel = "";

  // Look for a channel mention. If it doesn't exist, use the 4th arguement.
  if (message.mentions.channels.size > 0) {
    discordChannel = message.mentions.channels.first();
  }
  else {
    discordChannel = (args[3]) ? args[3] : message.settings.twitchDefaultAnnouncements;
  }
  if (!message.guild.channels.cache.find("name", discordChannel)) {
    message.react("❌");
    if (args[3]) return message.channel.send("Invalid Discord channel, please make sure it exists and is spelled right. Do not include the #.");
    return message.channel.send(`Couldn't find the default Discord channel, please set it up with ${message.settings.prefix}twitch `);
  }
  if (!discordChannel.permissionsFor(client.user).has("SEND_MESSAGES") || !discordChannel.permissionsFor(client.user).has("READ_MESSAGES")) {
    message.react("❌");
    return message.channel.send("I am not authorized to read or send messages in that discord channel. Please fix that, or try a different channel.");
  }
  bot.twitch.channels.ensure(user.id, {
    username: user.name,
    displayName: user.displayName,
    id: user.id,
    discords: []
  });
  const twitchChannel = bot.twitch.channels.get(user.id);
  const notifMsg = (args.length >= 5) ? args.slice(4).join(" ") : message.settings.twitchNotifMsg;
  twitchChannel.discords.push({
    guild: message.guild.id,
    channel: discordChannel.id,
    notifMessage: notifMsg,
    messageId: null
  });
  message.react("✔");
  message.channel.send(`Channel ${user.name} added to the database. Nofications will be posted in ${discordChannel.name}`);

  bot.twitch.eventClient.updateSubs(twitchChannel);
};
