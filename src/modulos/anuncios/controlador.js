const { EmbedBuilder } = require('discord.js');
const { client } = require('../../index');  // Import the client from index.js
const CHANNEL_ID = '1267127952496132118';

const TABLA = 'AnunciosYDeep';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    function anuncios(pagina = 1, limite = 10, tipo = "A") {
        return db.anuncios(TABLA, pagina, limite, tipo);
    }

    function unAnuncio(pagina = 1, limite = 10, user = null, name = null, tipo = "A") {
        return db.unAnuncio(TABLA, pagina, limite, user, name, tipo);
    }

    function crearPost(body) {
        return db.crearPost(TABLA, body);
    }

    function deletePost(postId) {
        return db.deletePost(TABLA, postId);
    }

    async function enviarMensajeDiscord(tipo, skin, user_id, name, content, creation_date) {
        try {
            if (!client || !client.channels) {
                throw new Error('El cliente de Discord no está inicializado correctamente');
            }
            const channel = await client.channels.fetch(CHANNEL_ID);
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Nuevo Anuncio')
                .addFields(
                    { name: 'Tipo', value: tipo, inline: true },
                    { name: 'Skin', value: skin, inline: true },
                    { name: 'Usuario ID', value: user_id, inline: true },
                    { name: 'Nombre', value: name, inline: true },
                    { name: 'Contenido', value: content },
                    { name: 'Fecha de Creación', value: creation_date }
                )
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error al enviar mensaje a Discord:', error);
        }
    }

    return {
        anuncios,
        unAnuncio,
        crearPost,
        deletePost,
        enviarMensajeDiscord
    };
};
