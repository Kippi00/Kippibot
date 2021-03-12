const { promisify} = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const pokedexDir = "./modules/pokemon-data/";
const Enmap = require("enmap");
const fuzzysort = require("fuzzysort");


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

const pkmObj = JSON.parse(fs.readFileSync(`${pokedexDir}/pokemon.json`));
/**
 * @type {Enmap}
 */
const pokemonDb = new Enmap(Object.entries(pkmObj));
const pokemonNames = pokemonDb.map(p => {
  return {
    "name": p.name,
    "alias1": p.alias,
    "alias2": p.sprite
  };
});

/**
 * 
 * @param {string} name Requested name.
 * @returns {Promise<string|Object|null>}
 */
const findPokemon = async (name, options = {limit: 50, allowTypo: true, threshold: -100, keys: ["name", "alias1", "alias2"]}) => {
  const results = await fuzzysort.goAsync(name, pokemonNames, options);
  if (results.total < 1) return null;
  const bestResult = results[0];
  //console.log(bestResult);
  if (bestResult.score === 0) return bestResult.obj.name;
  return {
    target: bestResult.obj.name,
    score: bestResult.score,
    totalMatches: results.total
  };
};

/** @type {Enmap} */
const typesDb = new Enmap();

const init = async () => {
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

    typesDb.set(typeName, newTypeObj);
  });
};



/**
 * 
 * @param {Object} stats Base stats object.
 * @param {Object} pokemon Pokemon object.
 * @returns {Promise<Object>} statsObj
 */
const convertToGoStats = async (stats, pokemon) => {
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
      const basePokemon = pokemonDb.find(p => p.name === pokemon.baseSpecies);
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
};

/**
 * 
 * @param {string} type Search category to search for.
 * @param {Object} param Additional arguements to pass on. {pokemon: "Bulbasaur || 1", stats: {...}}
 * @returns {Promise<Object|String|null>} result An object containing either a pokemon or stats.
 */
const pokedexSearch = async (type, param) => {
  //console.log(param);
  const pkmRequest = param.pokemon;
  const statRequest = param.stats;
  let result = null;
  if (type.includes("pokemon")) {
    if (typeof pkmRequest === "number") {
      const pokemonByNum = pokemonDb.find(p => p.num === pkmRequest);
      if (!pokemonByNum) result = "Couldn't find a pokemon with that number.";
      else result = pokemonByNum;
    } else {
      const match = await findPokemon(pkmRequest);
      console.log(match);
      if (!match) return null;
      if (typeof match === "object") {
        const score = Math.abs(match.score); // score -2 => 2
        const matchPercent = `${100 - score}%`;
        if (match.totalMatches === 1) result = `Didn't find an exact match. Did you mean ${match.target}? (${matchPercent} sure)`;
        else result = `Too many possible matches. Did you mean ${match.target}? (${matchPercent} sure)`;
      }
      if (typeof match === "string") {
        const pokemon = pokemonDb.find(p => p.name === match);
        if (type === "pokemon.info") result = pokemon;
        else if (type === "pokemon.stats" ) result = await mainStatCalculation(pokemon, statRequest);
        else if (type === "pokemon.goStats") result = await goStatCalculation(pokemon, statRequest);
      }
    }
  }
  //console.log(result);
  return result;
};

/**
 * 
 * @param {Object} pokemon Pokemon object
 * @returns {Promise<Object []>} evolutions Array of Pokemon Evolutions
 */
const getEvolutionData = async (pokemon) => {
  let evolutions = [
    {
      "name": pokemon.name,
      "form": 0
    }


  ];
  return evolutions;
};


/**
 * 
 * @param {Object} pokemon Pokemon object
 * @param {Object} statsObject Object containing stats: Example: {"level": level, "ivs": [ivs], "evs": [evs], "nature": nature}
 * @returns {Promise<Object>}
 */
const mainStatCalculation = async (pokemon, statsObject) => {
  return;
};

/**
 * 
 * @param {Object} pokemon Pokemon object
 * @param {Object} statsObject Object containing stats: Example: {"level": level, "ivs": [ivs], "cp": cp}
 * @returns {Promise<Object>}
 */
const goStatCalculation = async (pokemon, statsObject) => {
  return;
};

/**
 * 
 * @param {string []} typeArr An array of up to two types.
 * @param {Object} options An object containing the folliowing: {isGoRequest: false, isInverse: false};
 * @returns {Object []} An object array containing attacking types' and defending types' effectiveness.
 */
const getDefenseProfile = (typeArr, options = {isGoRequest: false, isInverse: false}) => {

  // Let's say type is Ghost
  const attackers = defaultTypes; // Normal vs Ghost

  attackers.forEach(t => t.effectiveness = 1);

  typeArr.forEach(async t => {
    const type = t.toLowerCase();
    const obj = typesDb.get(type);
    for (let i = 0; i < attackers.length; i++) {
      if (options.isGoRequest) attackers[i].effectiveness *= goDamage[obj.attackingTypes[i].effectiveness]; 
      else attackers[i].effectiveness *= obj.attackingTypes[i].effectiveness; 
    }
  });

  if (options.isInverse) attackers.forEach(t => {
    if (t.effectiveness === 0) t.effectiveness = 2;
    else t.effectiveness = 1 / t.effectiveness;
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

/**
 * @module 
 */
exports.pokemonDb = pokemonDb;
exports.typesDb = typesDb;
exports.pokedexSearch = pokedexSearch;
exports.getDefenseProfile = getDefenseProfile;
exports.convertToGoStats = convertToGoStats;
exports.getEvolutionData = getEvolutionData;
exports.init = init;

module.exports = exports;
