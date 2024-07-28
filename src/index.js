const app = require('./app');
const { Client, GatewayIntentBits } = require('discord.js');
const DISCORD_TOKEN = 'OTkyNDYxOTY3MTQ5MjUyNzA4.GKC7FI.hDGVi4Na4ni_gbyM5ZjNOhw1CrQvMUPZZ7aPOU';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(DISCORD_TOKEN).catch(console.error);

app.listen(app.get('port'), () => {
    console.log("Server on port", app.get('port'));
});

module.exports = { client };  // Export the client for use in other files
