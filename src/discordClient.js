require('dotenv').config(); // Cargar variables de entorno

const { Client, GatewayIntentBits } = require('discord.js');
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(DISCORD_TOKEN).catch(console.error);

module.exports = { client, waitForClientReady };
