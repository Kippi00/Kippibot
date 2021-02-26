const Bot = require("./bot");
const { getConfig } = require("./config");

const start = async () => {

  if (Number(process.version.slice(1).split(".")[0]) < 12) throw new Error("Node 12.0.0 or higher is required. Update Node on your system.");

  const config = await(getConfig);
  const bot = new Bot(config);

  return bot;
};


start();