exports.run = async (client, message, args, level, bot) => { // eslint-disable-line no-unused-vars
  const settings = message.settings;
  switch (args[0]) {
    default: {
      runHelpCommand();
      break;
    }
    case "stream": {
      switch (args[1]) {
        case "add": { // ~twitch stream add (channel) (discordChannel) (message)
          if (level >= 2) {
            require("../../modules/twitch/addStream.js")(client, message, args, bot);
          }
          else {
            if (settings.systemNotice === "true") {
              message.reply(`You do not have permission to use this command. 
              Your permission level is ${level} (${bot.config.permLevels.find(l => l.level === level).name}).
              This command requires level 2. (${bot.config.permLevels.find(l => l.level === 2).name})`);
            }
          }
          break;
        }
        case "remove" : { // ~twitch stream remove (channel)
          if (!args[2]) return message.reply("You must specify a channel to remove");
        } 
      }
      break;
    }
  }

  async function runHelpCommand(category) {
    // Valid categories: stream, role, defaultChannel
    // stream add, remove, edit
    // role @Role
    // defaultChannel #channel
    if (!category) {
      return console.log("Running help command.");
    }
    return console.log(`Running help command for category ${category}`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "twitch",
  category: "Twitch",
  description: "Twitch commands. To see all commmands you can use, use {{prefix}}twitch help.",
  usage: "twitch"
};