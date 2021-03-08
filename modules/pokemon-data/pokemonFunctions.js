const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const pokedexDir = "./modules/pokemon-data/";
const Enmap = require("enmap");
module.exports = async (client) => {
  const pkmObj = JSON.parse(fs.readFileSync(`${pokedexDir}/pokemon.json`));
  client.pokemonDb = new Enmap(Object.entries(pkmObj));
};

