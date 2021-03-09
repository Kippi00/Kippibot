const { promisify} = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const pokedexDir = "./modules/pokemon-data/";
const Enmap = require("enmap");
const { Client } = require("discord.js");

const defaultTypes = [
  { type: "Bug", effectiveness: 1 },
  { type: "Dark", effectiveness: 1 },
  { type: "Dragon", effectiveness: 1 },
  { type: "Electric", effectiveness: 1 },
  { type: "Fairy", effectiveness: 1 },
  { type: "Fighting", effectiveness: 1 },
  { type: "Fire", effectiveness: 1 },
  { type: "Flying", effectiveness: 1 },
  { type: "Ghost", effectiveness: 1 },
  { type: "Grass", effectiveness: 1 },
  { type: "Ground", effectiveness: 1 },
  { type: "Ice", effectiveness: 1 },
  { type: "Normal", effectiveness: 1 },
  { type: "Poison", effectiveness: 1 },
  { type: "Psychic", effectiveness: 1 },
  { type: "Rock", effectiveness: 1 },
  { type: "Steel", effectiveness: 1 },
  { type: "Water", effectiveness: 1 }
];

/**
 * @module 
 * @param {Client} client 
 */
module.exports = async (client) => {
  const pkmObj = JSON.parse(fs.readFileSync(`${pokedexDir}/pokemon.json`));
  client.pokemonDb = new Enmap(Object.entries(pkmObj));

  /** @type {Enmap} */
  const typesDb = new Enmap();
  client.typesDb = typesDb;

  const typesDir = await readdir(`${pokedexDir}/types`);
  typesDir.forEach(f => {
    const typeName = f.split(".")[0];
    const typeObj = require(`../pokemon-data/types/${f}`);

    const defenders = Object.entries(typeObj.defendingTypes).map(t => {
      return {
        "type": t[0],
        "effectiveness": t[1]
      };
    });
    
    const attackers = Object.entries(typeObj.attackingTypes).map(t => {
      return {
        "type": t[0],
        "effectiveness": t[1]
      };
    });

    defenders.sort((a, b) => {
      if (a.type.toUpperCase() < b.type.toUpperCase()) return -1;
      
      if (a.type.toUpperCase() > b.type.toUpperCase()) return 1;
      
      return 0;
    });

    attackers.sort((a, b) => {
      if (a.type.toUpperCase() < b.type.toUpperCase()) return -1;
      
      if (a.type.toUpperCase() > b.type.toUpperCase()) return 1;
      
      return 0;
    });


    const newTypeObj = {
      "defendingTypes": defenders,
      "attackingTypes": attackers
    };

    client.typesDb.set(typeName, newTypeObj);
  });

  /**
   * 
   * @param {Object} stats Base stats object.
   * @param {Object} pokemon Pokemon object.
   * @returns {Promise<Object>} statsObj
   */
  client.convertToGoStats = async (stats, pokemon) => {
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
        const baseFormeStats = await client.convertToGoStats(basePokemon.baseStats, basePokemon);
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
  };

  /**
   * 
   * @param {string} type Search category to search for.
   * @param {string} param Additional arguements to pass on.
   * @returns {Object} result The pokemon object.
   */
  client.pokedexSearch = (type, param) => {
    let result = null;
    if (type === "pokemon") {
      result = client.pokemonDb.find(p => p.name === param || p.alias === param || p.sprite === param);
    }
    return result;
  };

  /**
   * 
   * @param {string []} typeArr An array of up to two types.
   * @param {boolean} isGoRequest Whether to check for Go stats or MSG stats.
   * @returns {Object []} An object array containing attacking types' and defending types' effectiveness.
   */
  client.getDefenseProfile = (typeArr, isGoRequest) => {

    // Let's say type is Ghost
    const attackers = defaultTypes; // Normal vs Ghost

    attackers.forEach(t => t.effectiveness = 1);

    typeArr.forEach(t => {
      const type = t.toLowerCase();
      if (client.typesDb.has(type)) {
        const obj = client.typesDb.get(type);
        for (let i = 0; i < attackers.length; i++) {
          if (isGoRequest) attackers[i].effectiveness *= goDamage[obj.attackingTypes[i].effectiveness]; 
          else attackers[i].effectiveness *= obj.attackingTypes[i].effectiveness; 
        }
      }
    });

    return attackers;

  };

  const goDamage = {
    0.0: 25/64,
    0.25: 25/64,
    0.5: 5/8,
    1.0: 1,
    2.0: 8/5,
    4.0: 64/25
  };
};


