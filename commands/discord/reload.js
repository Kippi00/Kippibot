exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  if (!args || args.length < 1) return message.reply("Must provide a command to reload. Derp.");
  const command = client.discordCommands.get(args[0]) || client.discordCommands.get(client.discordAliases.get(args[0]));
  let response = await client.unloadCommand(args[0], "discord");
  if (response) return message.reply(`Error Unloading: ${response}`);

  response = client.loadCommand(command.help.name, "discord");
  if (response) return message.reply(`Error Loading: ${response}`);

  message.reply(`The command \`${command.help.name}\` has been reloaded`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "Bot Admin"
};

exports.help = {
  name: "reload",
  category: "System",
  description: "Reloads a command that\"s been modified.",
  usage: "reload [command]"
};