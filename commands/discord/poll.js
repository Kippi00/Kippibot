const { MessageEmbed, Collection } = require("discord.js");
const moment = require("moment");
const reactionTemplate = [
  "1️⃣", 
  "2️⃣", 
  "3️⃣", 
  "4️⃣", 
  "5️⃣", 
  "6️⃣", 
  "7️⃣", 
  "8️⃣", 
  "9️⃣", 
  "0️⃣" 
];
const durationMatch = {
  "s": "second(s)",
  "m": "minute(s)",
  "h": "hour(s)",
  "d": "day(s)"
};

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  switch (message.flags[0]) {
    case "create": {
      const allArgs = args.join(" ").split('"'); // eslint-disable-line quotes
      const question = allArgs[1]; 
      const lastIndx = allArgs.length - 1; // lastIndx contains args that aren't in quotes
      const options = [];
      allArgs.forEach(el => {
        if (el === "" || el === question || el === " ") return;
        if (allArgs.indexOf(el) === lastIndx) return;
        options.push(el);
      });
      console.log(question);
      console.log(options);
      if (options.length < 1) 
        return message.reply(`The poll has too few options.\n\nYou need at least 2, each option enclosed in quotes. Ex. ${message.settings.prefix}poll create "Favorite fruit?" "Apples, Bananas, Oranges" ...`);
      if (options.length > 10) {
        return message.reply("The max amount of options has been exceeded. I can only run a poll with up to 10 options.");
      }

      const channelIndx = args[args.length - 2];
      const durationIndx = args[args.length - 1];
      
      const channel = (!isNaN(parseInt(channelIndx, 10))) ? message.guild.channels.cache.get(channelIndx) : message.guild.channels.cache.find(c => c.name === channelIndx);
      if (!channel) return message.reply("Invalid channel. I accept either the channel name or its ID number, but not a channel mention.");
      if (!channel.permissionsFor(message.guild.me).has(["SEND_MESSAGES", "VIEW_CHANNEL"])) 
        return message.reply("I am unable to view or send messages to that channel. Please ensure that I have both permissions.");
      if (!channel.permissionsFor(message.guild.me).has(["ADD_REACTIONS", "MANAGE_MESSAGES"])) 
        return message.reply("I am missing the ability to add or remove reactions. Please check that I have both the Add Reactions and Manage Messages permissions.");
      
      const currentTime = moment();
      let duration;
      let endTime;
      let param;
      let unit = durationIndx.substring(durationIndx.length - 1);
      switch (unit) {
        case "m":
        case "h":
        case "s": 
        case "d": {
          param = parseInt(durationIndx.substring(0, durationIndx.length - 1));
          if (unit === "s") duration = param;
          if (unit === "m") duration = param * 60;
          if (unit === "h") duration = param * 3600;
          if (unit === "d") duration = param * 86400;
          endTime = currentTime.add(param, unit);
          break;
        }
        default: {
          param = durationIndx;
          unit = "s";
          duration = param;
          endTime = currentTime.add(param, "s");
          break;
        }
      }

      if (isNaN(endTime)) return message.reply("I couldn't understand that duration.");

      const optionsArr = [];
      let field = "";

      const embedInit = new MessageEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true}))
        .setTitle(`A new poll has been started - ${question}`)
        .setDescription(`Ends in: ${param} ${durationMatch[unit]}`)
        .setFooter("Start Time")
        .setTimestamp(moment());

      for (let i = 0; i < options.length; i++) {
        const obj = {
          "reaction": reactionTemplate[i],
          "option": options[i],
          "votes": 0
        };
        optionsArr.push(obj);
        field += `${reactionTemplate[i]}: ${options[i]}\n`;
      }

      embedInit.addField("Options", field);

      const reactions = optionsArr.map(e => {
        return e.reaction;
      });

      const voters = new Collection();
      
      message.delete().catch(console.error);
      const msg = await channel.send(embedInit).catch(console.error);
      optionsArr.forEach(obj => {
        msg.react(obj.reaction);
      });
      msg.react("🛑");

      const filter = async (reaction, user) => { // eslint-disable-line no-unused-vars
        const voter = voters.get(user.id);
        if (reaction.emoji.name === "🛑" && user.id === message.author.id) {
          closePoll();
        }
        if (reactions.indexOf(reaction.emoji.name) >= 0) {
          if (user.id !== client.user.id) {
            // Remove a users current reaction if they decide to change their vote.
            if (voter) {
              const r = await msg.reactions.cache.get(voter.option);
              r.users.remove(user.id);
              voters.set(user.id, {
                id: user.id,
                option: reaction.emoji.name
              });
            } else  {
              voters.set(user.id, {
                id: user.id,
                option: reaction.emoji.name
              });
            }
          }
          return true;
        }
        return false;
      };

      const collector = await msg.createReactionCollector(filter, { time: duration * 1000 });
      const results = [];
      let resultsStr = "";

      const closePoll = () => {
        collector.stop("Stopped by author.");
      };

      collector.on("end", async (c, reason) => {
        await c.forEach(reaction => {
          const arr = optionsArr.filter(el => {
            return el.reaction === reaction.emoji.name;
          });
  
          // We can assume that arr will only have 1 element, because we can't have duplicate emoji reactions.
          arr[0].votes = reaction.count - 1; // subtract 1 to exclude the bot's reaction.
          results.push(arr[0]);
          resultsStr += `${arr[0].reaction}: ${arr[0].option} - ${arr[0].votes} votes\n`;
        });

        const highest = Math.max.apply(Math, results.map(el => {
          return el.votes;
        }));
  
        if (highest < 1) {
          return msg.channel.send("The poll has ended... but with 0 votes?! 😭");
        }
  
        const winnerArr = results.filter(el => {
          return el.votes === highest;
        });
  
        //return console.log(winnerArr);
  
        const winners = winnerArr.map(w => {
          return w.option;
        }); 
  
        console.log(winners);
        
        const embedResults = new MessageEmbed()
          .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true}))
          .setTitle(`The poll "${question}" has ended!`);
        if (reason === "Stopped by author.") {
          embedResults.setFooter("Ended forcibly.");
          embedResults.setTimestamp(moment());
        } else {
          embedResults.setFooter("End Time");
          embedResults.setTimestamp(endTime);
        }
  
        if (winnerArr.length > 1) {
          embedResults.setDescription(`The poll has ended in a tie. The options with ${highest} votes
          are: **${winners.join(", ")}**`);
        } else {
          embedResults.setDescription(`The poll has ended! The winner with ${highest} votes is: **${winners[0]}**`);
        }
  
        embedResults.addField("Results", resultsStr);
  
        await msg.channel.send(embedResults).catch(console.error);
        voters.clear();
      });

      break;
    }
    default:
      message.channel.send(`= ${this.help.name} = \n${this.help.description}\nusage:: ${this.help.usage}\naliases:: ${this.conf.aliases.join(", ")}\n= ${this.help.name} =`, {code:"asciidoc"});
      break;
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Moderator"
};

exports.help = {
  name: "poll",
  category: "Fun",
  description: "Create a poll! Specify up to 10 options and post it to a channel with a specified duration. Duration is in seconds by default, but can be converted by including the corresponding letter for it (m for minutes, h for hours, d for days). Maximum duration is 7 days. Question and each option must be enclosed in quotes. Ex. poll create \"Favorite fruit?\" \"Apples\" \"Bananas\" \"Oranges\" ...",
  usage: "poll [-create] [\"question\"] [\"options\"] [channel] [duration]"
};