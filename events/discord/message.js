// The MESSAGE event runs anytime a message is received
// Note that due to the binding of discordClient to every event, every event
// goes `discordClient, other, args` when this function is run.

const { MessageEmbed } = require("discord.js"); // eslint-disable-line no-unused-vars

module.exports = async (discordClient, message) => {
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Grab the settings for this server from Enmap.
  // If there is no guild, get default conf (DMs)
  const settings = message.settings = discordClient.getSettings(message.guild);

  // Checks if the bot was mentioned, with no message after it, returns the prefix.
  const prefixMention = new RegExp(`^<@!?${discordClient.user.id}>( |)$`);
  if (message.content.match(prefixMention)) {
    return message.reply(`My prefix on this guild is \`${settings.prefix}\``);
  }

  if (!message.guild) await discordClient.logger.log(`Recieved DM from ${message.author.tag}: ${message.content}`);

  // If the member on a guild is invisible or not cached, fetch them.
  if (message.guild && !message.member) await message.guild.members.fetch(message.author);

  // XP system. 
  // It is only enabled in guilds, and there is a check in place to make sure the bot 
  // can send messages to announce when a user levels up.
  // This is also where the recentChatters set comes into play. To combat spam, if the user
  // sends a message while on cooldown, they will not get XP.
  
  if (message.guild && message.channel.permissionsFor(discordClient.user).has("SEND_MESSAGES") && 
  !discordClient.recentChatters.has(message.author.id)) {
    // Add user to recent chatters, then remove them after 2.5 seconds.
    discordClient.recentChatters.add(message.author.id);
    setTimeout(() => {
      discordClient.recentChatters.delete(message.author.id);
    }, 2500);
    const key = `${message.guild.id}-${message.author.id}`;
    discordClient.userProfiles.ensure(key, {
      user: message.author.id,
      guild: message.guild.id,
      xp: 0,
      level: 0
    });

    //Increase user's XP by a random amount from 1 to 30.

    const xpAmount = Math.max(1, Math.floor(Math.random() * 30));
    discordClient.userProfiles.math(key, "+", xpAmount, "xp");
    
    // Calculate the user's current level, and adjust if needed.
    const currentLevel = Math.floor(0.1 * Math.sqrt(discordClient.userProfiles.get(key, "xp")));
    if (currentLevel > discordClient.userProfiles.get(key, "level")) {
      const settings = discordClient.getSettings(message.member.guild);
      const nickname = (message.member.nickname) ? message.member.nickname : message.author.username;
      discordClient.userProfiles.inc(key, "level");
      // Send the level up message in the channel of the user's last message.
      const levelUpMessage = settings.levelUpMessage.replace("{{user}}", message.author.username).replace("{{level}}", currentLevel).replace("{{nick}}", nickname);
      message.channel.send(levelUpMessage);
    }

  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if (message.content.indexOf(settings.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Get the user or member's permission level from the elevation
  const level = discordClient.permlevel(message);

  // Check whether the command, or alias, exist in the collections defined
  // in app.js.
  const cmd = discordClient.commands.get(command) || discordClient.commands.get(discordClient.aliases.get(command));
  // using this const varName = thing OR otherThing; is a pretty efficient
  // and clean way to grab one of 2 values!
  if (!cmd) return;

  // Some commands may not be useable in DMs. This check prevents those commands from running
  // and return a friendly error message.
  if (cmd && !message.guild && cmd.conf.guildOnly)
    return message.channel.send("This command is unavailable via private message. Please run this command in a guild.");

  if (level < discordClient.levelCache[cmd.conf.permLevel]) {
    if (settings.systemNotice === "true") {
      return message.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} (${discordClient.config.permLevels.find(l => l.level === level).name})
  This command requires level ${discordClient.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
    } else {
      return;
    }
  }

  // To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
  // The "level" command module argument will be deprecated in the future.
  message.author.permLevel = level;
  
  message.flags = [];
  while (args[0] && args[0][0] === "-") {
    message.flags.push(args.shift().slice(1));
  }
  // If the command exists, **AND** the user has permission, run it.
  discordClient.logger.cmd(`[CMD] ${discordClient.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`);
  cmd.run(discordClient, message, args, level);
};
