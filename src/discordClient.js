const { Client, GatewayIntentBits } = require('discord.js');
const config = require('../config');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log('Discord client ready!');
});

client.login(config.discord.token);

module.exports = client;
