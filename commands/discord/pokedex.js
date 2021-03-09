const { MessageEmbed, Client, Message } = require("discord.js");

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @param {string []} args 
 * @returns {Promise}
 */
exports.run = async (client, message, args) => { // eslint-disable-line no-unused-vars
  switch (message.flags[0]) {
    default:
      message.channel.send(`= ${this.help.name} = \n${this.help.description}\nusage:: ${this.help.usage}\naliases:: ${this.conf.aliases.join(", ")}\n= ${this.help.name} =`, {code:"asciidoc"});
      break;
    case "help":
    case "h":
      message.channel.send(`= ${this.help.name} = \n${this.help.description}\nusage:: ${this.help.usage}\naliases:: ${this.conf.aliases.join(", ")}\n= ${this.help.name} =`, {code:"asciidoc"});
      break;
    case "pokemon": 
    case "pkm": {
      if (args.length < 1) return;
      const pokemon = client.pokedexSearch("pokemon", args.join(" ").toProperCase());
      if (!pokemon) return message.reply("Pokemon not found. Make sure it is spelled correctly.");
      const baseStats = pokemon.baseStats;
      let goStats = {};
      const abilities = Object.entries(pokemon.abilities);
      const types = pokemon.types;
      let typeStr = "";

      console.log(baseStats);

      types.forEach(t => {
        const emoji = getTypeEmoji(client, t);
        typeStr += `${emoji} ${t}\n`;
      });

      let pokemonGif = "";
      if (message.flags[1] === "shiny" || message.flags[2] === "shiny") pokemonGif = `https://play.pokemonshowdown.com/sprites/ani-shiny/${pokemon.sprite}.gif`;
      else pokemonGif = `https://play.pokemonshowdown.com/sprites/ani/${pokemon.sprite}.gif`;

      console.log(pokemonGif);

      const embed = new MessageEmbed();

      if (message.flags[1] === "go" || message.flags[2] === "go") {
        goStats = await client.convertToGoStats(baseStats, pokemon);
        if (!goStats) return message.channel.send("Couldn't get Pokemon Go Stats. Something went terribly wrong.");
        const goStatsStr = `**Attack**: ${goStats.attack}\n**Defense**: ${goStats.defense}\n**Stamina**: ${goStats.stamina}`;
        const maxCPStr = `**@L40**: ${goStats.lv40CP}\n**@L50**: ${goStats.lv50CP}`;
        embed.setTitle(`#${pokemon.num} ${pokemon.name} (GO Stats)`)
          .addField("Base Stats", goStatsStr, true)
          .addField("Type", typeStr, true)
          .addField("Max CP", maxCPStr, true)
          .setColor(typeColor[types[0].toLowerCase()])
          .setImage(pokemonGif);
      }

      else {
        const baseStatsStr = `**HP**: ${baseStats.hp}\n**Atk**: ${baseStats.atk}\n**Def**: ${baseStats.def}\n**Sp. Atk**: ${baseStats.spa}\n**Sp. Def**: ${baseStats.spd}\n**Speed**: ${baseStats.spe}`;
        let abilitiesStr = "";

        abilities.forEach(k => {
          if (k[0] === "H") {
            abilitiesStr += `- ${k[1]} (Hidden)`;
          } else {
            abilitiesStr += `- ${k[1]}\n`;
          }
        });


        embed.setTitle(`#${pokemon.num} ${pokemon.name}`)
          .addField("Base Stats", baseStatsStr, true)
          .addField("Type", typeStr, true)
          .addField("Abilities", abilitiesStr, true)
          .setColor(typeColor[types[0].toLowerCase()])
          .setImage(pokemonGif);
      }
      message.channel.send(embed).catch(console.error);
      break;
    }
    case "weakness": 
    case "weak": {
      const types = args.slice(0, 2); // Only take the first two args.
      const isGoRequest = message.flags[1] === "go";
      const defenseProfile = client.getDefenseProfile(types, isGoRequest);
      const doubleWeak = [];
      const singleWeak = [];
      const neutral = [];
      const singleResist = [];
      const doubleResist = [];
      const tripleResist = []; // Go only
      const immune = []; // MSG only

      
      defenseProfile.forEach(t => {
        console.log(t);
        const e = t.effectiveness;
        if (e === 4 || e === Math.pow(8/5, 2)) doubleWeak.push(`${getTypeEmoji(client, t.type)}`);
        else if (e === 2 || e === 8/5) singleWeak.push(`${getTypeEmoji(client, t.type)}`);
        else if (e === 1/2 || e === 5/8) singleResist.push(`${getTypeEmoji(client, t.type)}`);
        else if (e === 1/4 || e === 25/64) doubleResist.push(`${getTypeEmoji(client, t.type)}`);
        else if (e === 125/512) tripleResist.push(`${getTypeEmoji(client, t.type)}`);
        else if (e === 0) immune.push(`${getTypeEmoji(client, t.type)}`);
        else neutral.push(`${getTypeEmoji(client, t.type)}`);
      });

      const embed = new MessageEmbed();
      

      let title = `Defense profile for **${types.join("/")}**`;
      types.forEach(t => title += ` ${getTypeEmoji(client, t)}`);

      // Go types = 8/5 - weak, 5/8 - res, 25/65 - double res 

      embed.setTitle(title);
      embed.setColor(typeColor[types[0].toLowerCase()]);

      if (isGoRequest) {
        if (doubleWeak.length > 0) embed.addField("Weaknesses (2.56x)", doubleWeak.join(" "));
        if (singleWeak.length > 0) embed.addField("Weaknesses (1.6x)", singleWeak.join(" "));
        if (neutral.length > 0) embed.addField("Neutral (1x)", neutral.join(" "));
        if (singleResist.length > 0) embed.addField("Resistances (0.625x)", singleResist.join(" "));
        if (doubleResist.length > 0) embed.addField("Resistances (0.391x)", doubleResist.join(" "));
        if (tripleResist.length > 0) embed.addField("Resistances (0.244x)", tripleResist.join(" "))
      }
      else {
        if (doubleWeak.length > 0) embed.addField("Weaknesses (4x)", doubleWeak.join(" "));
        if (singleWeak.length > 0) embed.addField("Weaknesses (2x)", singleWeak.join(" "));
        if (neutral.length > 0) embed.addField("Neutral (1x)", neutral.join(" "));
        if (singleResist.length > 0) embed.addField("Resistances (0.5x)", singleResist.join(" "));
        if (doubleResist.length > 0) embed.addField("Resistances (0.25x)", doubleResist.join(" "));
        if (immune.length > 0) embed.addField("Immunities (0x)", immune.join(" "));
      }
    

      message.channel.send(embed);

      //let defenseProfileStr = "";
      //defenseProfile.forEach(e => defenseProfileStr += `${e.type}: ${e.effectiveness} `);
      //message.channel.send(`Defense profile for **${types.join("/")}** :\n${defenseProfileStr}`);
      break;
    }
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["dex"],
  permLevel: "User"
};

exports.help = {
  name: "pokedex",
  category: "Unknown",
  description: "Get info on pokemon and type matchups!",
  usage: "\nPokemon: pokedex [-pokemon|-pkm] [-go] [-shiny] [pokemon]. Go and shiny flags are optional, you can specify them in any order before the pokemon name. If the go flag is speficied, it will get stats from Pokemon GO. If the shiny flag is specified, the shiny Pokemon gif will be posted.\nType Defense Profile: pokedex [-weak] [-go] [type1] [type2] - Only one type needs to be specified. Go flag is optional, if specified before the type name it will get the type matchups as they are represented in Pokemon GO."
};

const typeColor = {
  "normal": 0xA8A77A, //grey
  "fire": 0xEE8130, //orange
  "water": 0x6390F0, //blue
  "electric": 0xF7D02C, //yellow
  "grass": 0x7AC74C, //green
  "ice": 0x96D9D6, //light blue
  "fighting": 0xC22E28, //red
  "poison": 0xA33EA1, //purple
  "ground": 0xEABF65, //light brown
  "flying": 0xA98FF3, //sky blue
  "psychic": 0xF95587, //magenta-ish
  "bug": 0xA6B91A, //yellow-green
  "rock": 0xB6A136, //brown
  "ghost": 0x735797, //indigo
  "dragon": 0x6F35FC, //navy blue
  "dark": 0x705746, //black
  "steel": 0xB7B7CE, //silver
  "fairy": 0xD685AD //pink
};

const getTypeEmoji = (client, type) => {
  return client.emojis.cache.find(e => e.name === `type${type.toLowerCase()}` && e.guild.id === "492830840309678091");
};