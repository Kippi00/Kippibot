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
    let reason = "";
    const logs = await guild.fetchAuditLogs({ type: 22}).catch(console.error);
    const banLog = await logs.entries.find(l => (l.target.username === user.username 
      && l.createdTimestamp > (Date.now() - 5000)));

    if (banLog) {
      executor = banLog.executor.username;
      reason = banLog.reason;
    }

    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]:`;
    const embed = new MessageEmbed()
      .setAuthor(`${executor || "Unknown Executor"}`)
      .setColor(0xFF0000)
      .setTitle("Type: Ban")
      .setDescription(`Member ${user.tag} has been banned from ${guild.name}`)
      .setTimestamp(timestamp);

    embed.addField("Reason", `${reason || "No Reason"}`);

    ch.send(embed).catch(console.error);
  }
};