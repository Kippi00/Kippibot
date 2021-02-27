const { MessageEmbed } = require("discord.js");
const moment = require("moment");
module.exports = async (client, guild, user) => {
  const settings = client.getSettings(guild);
  let ch;
  if (settings.modLog !== "true") return;

  if (isNaN(parseInt(settings.modLogChannel, 10))) {
    ch = await guild.channels.cache.find(c => c.name === settings.modLogChannel);
  }
  else {
    ch = await guild.channels.cache.get(settings.modLogChannel);
  }

  if (ch) {
    let executor = "";
    const logs = await guild.fetchAuditLogs({ type: 23}).catch(console.error);
    const entry = await logs.entries.find(l => (l.target.username === user.username 
      && l.createdTimestamp > (Date.now() - 5000)));

    if (entry) {
      executor = entry.executor.username;
    }

    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
    const embed = new MessageEmbed()
      .setAuthor(`${executor || "Unknown Executor"}`)
      .setColor(0x00FF00)
      .setTitle("Type: Unban")
      .setDescription(`Member ${user.tag} has been unbanned from ${guild.name}`)
      .setTimestamp(timestamp);

    ch.send(embed).catch(console.error);
  }
};