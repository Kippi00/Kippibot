const { MessageEmbed } = require("discord.js");


const pokedexSearch = (client, type, param) => {
  let result = null;
  if (type === "pokemon") {
    result = client.pokemonDb.find(p => p.name === param || p.alias === param || p.sprite === param);
  }
  return result;
};

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  switch (message.flags[0]) {
    default:
      message.channel.send(`= ${this.help.name} = \n${this.help.description}\nusage:: ${this.help.usage}\naliases:: ${this.conf.aliases.join(", ")}\n= ${this.help.name} =`, {code:"asciidoc"});
      break;
    case "help":
    case "h":
      message.channel.send(`= ${this.help.name} = \n${this.help.description}\nusage:: ${this.help.usage}\naliases:: ${this.conf.aliases.join(", ")}\n= ${this.help.name} =`, {code:"asciidoc"});
      break;
    case "pokemon": {
      if (args.length < 1) return;
      const pokemon = pokedexSearch(client, "pokemon", args.join(" ").toProperCase());
      if (!pokemon) return message.reply("Pokemon not found. Make sure it is spelled correctly.");

      const baseStats = pokemon.baseStats;
      let goStats = {};
      const abilities = Object.entries(pokemon.abilities);
      const types = pokemon.types;
      let typeStr = "";

      console.log(baseStats);

      types.forEach(t => {
        const emoji = client.emojis.cache.find(e => e.name === `type${t.toLowerCase()}` && e.guild.id === '492830840309678091')
        typeStr += `${emoji} ${t}\n`
      });

      let pokemonGif = "";
      if (message.flags[1] === "shiny" || message.flags[2] === "shiny") pokemonGif = `https://play.pokemonshowdown.com/sprites/ani-shiny/${pokemon.sprite}.gif`;
      else pokemonGif = `https://play.pokemonshowdown.com/sprites/ani/${pokemon.sprite}.gif`;

      console.log(pokemonGif);

      const embed = new MessageEmbed();

      if (message.flags[1] === "go") {
        goStats = await convertToGoStats(client, baseStats, pokemon);
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

        //message.channel.send(baseStatsStr);

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
  description: "It's a command.",
  usage: "pokedex [-pokemon|-item|-move]"
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

async function convertToGoStats (client, stats, pokemon) { // returns {"stamina": 255, "attack": 255, "defense": 255, "LV40CP": 9000, "LV50CP": 10000}
  const hp = stats.hp, 
    atk = stats.atk, 
    def = stats.def, 
    spAtk = stats.spa, 
    spDef = stats.spd, 
    speed = stats.spe;

  let stamina = 0, attack = 0, defense = 0, speedMult = 1;

  let statsObj = {
    "stamina": 0,
    "attack": 0,
    "defense": 0,
    "uber": false, // true if initial cp is over 4000 and stats had to be adjusted, false otherwise
    "lv40CP": 0,
    "lv50CP": 0
  };

  let lv40CP = 0;
  let adjustedlv40CP = 0;
  let lv50CP = 0;

  speedMult = 1 + (speed - 75) / 500; 

  //Shedinja case
  if (pokemon.name === "Shedinja") stamina = 1;
  else stamina = Math.trunc(50 + 1.75 * hp);

  attack = Math.round((0.25 * Math.min(atk, spAtk) + 1.75 * Math.max(atk, spAtk)) * speedMult);
  defense = Math.round((0.75 * Math.min(def, spDef) + 1.25 * Math.max(def, spDef)) * speedMult);

  const statsArr = [attack, defense, stamina];

  lv40CP = Math.floor(Math.max(10, 
    (Math.sqrt(stamina + 15) * (attack + 15) * Math.sqrt(defense + 15) * Math.pow(0.7903, 2) / 10)));
  
  // There is a stat adjustment put in place for pokemon over 4000 CP initally, to keep things from becoming too OP.
  if (lv40CP > 4000) {
    console.log("CP is greater than 4000. Adjusting CP.");
    let baseFormeAdjust = true;
    if ((pokemon.forme) && (pokemon.forme.includes("Mega"))) {
      // We must see if the pokemon's base forme hits over 4000 CP first
      const basePokemon = client.pokemonDb.find(p => p.name === pokemon.baseSpecies);
      if (!basePokemon) {
        console.error("Couldn't find the base pokemon. Something went seriously wrong here!");
        statsObj = null;
        return;
      } 
      const baseFormeStats = await convertToGoStats(basePokemon.baseStats, basePokemon);
      // Make the adjustments to the new forme if the base forme hits over 4000 CP.
      baseFormeAdjust = baseFormeStats.uber;
    }
    statsObj.uber = baseFormeAdjust;
    if (statsObj.uber) {
      const newStatsArr = statsArr.map(s => {
        return Math.round(s * 0.91);
      });

      attack = newStatsArr[0], defense = newStatsArr[1], stamina = newStatsArr[2];
      adjustedlv40CP = Math.floor(Math.max(10, 
        (Math.sqrt(stamina + 15) * (attack + 15) * Math.sqrt(def + 15) * Math.pow(0.7903, 2) / 10)));
    } 
  }

  if (adjustedlv40CP > 0) lv40CP = adjustedlv40CP;

  lv50CP = Math.floor(Math.max(10, 
    (Math.sqrt(stamina + 15) * (attack + 15) * Math.sqrt(defense + 15) * Math.pow(0.840300023555755, 2) / 10)));

  statsObj.stamina = stamina, statsObj.attack = attack, statsObj.defense = defense;
  statsObj.lv40CP = lv40CP, statsObj.lv50CP = lv50CP;

  return statsObj;
}