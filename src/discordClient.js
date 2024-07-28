const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log('Conectado a Discord!');
});

client.login(config.discord.token);

async function sendEmbedMessage(embed) {
    const channel = await client.channels.fetch(config.discord.channelId);
    channel.send({ embeds: [embed] });
}

module.exports = {
    sendEmbedMessage,
};
