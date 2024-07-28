const { Client, GatewayIntentBits } = require('discord.js');
const DISCORD_TOKEN = 'OTkyNDYxOTY3MTQ5MjUyNzA4.GKC7FI.hDGVi4Na4ni_gbyM5ZjNOhw1CrQvMUPZZ7aPOU';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let isReady = false;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    isReady = true;
});

client.login(DISCORD_TOKEN).catch(console.error);

async function waitForClientReady() {
    while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('El cliente de Discord está listo');
}

module.exports = { client, waitForClientReady };
