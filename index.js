const Discord = require('discord.js');
const discordClient = new Discord.Client();
const config = require('./config.json');

discordClient.login(config.discordToken);

discordClient.on('ready', () => {
	console.log('Ready to go! ✔')
});

discordClient.on('message', message => {
	if (message.content === '!ping') 
		message.reply('Pong!');
});