const { EmbedBuilder } = require('discord.js');
const { client, waitForClientReady } = require('../../discordClient'); // Ajusta la ruta según tu estructura
const CHANNEL_ID = '1267127952496132118'; // Asegúrate de que este ID sea el correcto

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
            await waitForClientReady();
            console.log('Cliente de Discord está listo para enviar mensaje');
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) {
                throw new Error('Canal no encontrado');
            }
            console.log(`Canal obtenido: ${channel.name}`);
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('¡Nuevo Anuncio!')
                .setDescription(`Un nuevo anuncio ha sido creado. Aquí están los detalles:`)
                .setThumbnail('https://i.imgur.com/1ABiNzE.png') // Reemplaza con una URL de imagen adecuada
                .addFields(
                    { name: 'Tipo', value: tipo, inline: true },
                    { name: 'Skin', value: skin, inline: true },
                    { name: 'Usuario ID', value: user_id, inline: true },
                    { name: 'Nombre', value: name, inline: true },
                    { name: 'Contenido', value: content },
                    { name: 'Fecha de Creación', value: creation_date }
                )
                .setFooter({ text: '¡Gracias por tu atención!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log('Mensaje enviado a Discord');
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