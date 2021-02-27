const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = async (client, message) => {
  const settings = client.getSettings(message.guild);
  let ch;
  if (settings.modLog !== "true") return;

  // Ignore the bot deleting its own messages.
  if (message.author === client.user) return;

  // Ignore messages deleted in the mod log channel. 
  if (message.channel.name === settings.modLogChannel || message.channel.id === settings.modLogChannel) return;

  if (isNaN(parseInt(settings.modLogChannel, 10))) {
    ch = await message.guild.channels.cache.find(c => c.name === settings.modLogChannel);
  }
  else {
    ch = await message.guild.channels.cache.get(settings.modLogChannel);
  }

  if (ch) {
    const entry = await message.guild.fetchAuditLogs({ type: 72}).then(audit => audit.entries.first());
    let user = "";
    
    if (entry.extra.channel.id === message.channel.id
      && (entry.target.id === message.author.id)
      && (entry.createdTimestamp  > (Date.now() - 5000))
      && (entry.extra.count >= 1)) {
      user = entry.executor;
    } else {
      user = message.author;
    }

    let content = message.cleanContent;
    if (!content) content = "[Unknown Message]";
    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]:`;
    const embed = new MessageEmbed()
      .setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
      .setColor(0xFF0000)
      .setTitle("Type: Message Delete")
      .setDescription(`Message from ${message.author.tag} in ${message.channel} deleted`)
      .setTimestamp(timestamp);

    // Fields can only be 1024 characters, so we'll split it if it's more than 1024
    if (content.length > 1024) {
      embed.addField("Message (1)", content.slice(0, 1024));
      embed.addField("Message (2)", content.slice(1024));
    }
    else {
      embed.addField("Message", content);
    }

    ch.send(embed).catch(console.error);
  }

  //client.logger.log(`[DISCORD] Message deleted: ${message.cleanContent}`);
};