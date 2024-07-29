require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const { client, waitForClientReady } = require('../../discordClient'); // Ajusta la ruta según tu estructura
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // Asegúrate de que este ID sea el correcto

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

    async function enviarMensajeDiscord(tipo, skin, user_id, name, content, creation_date, base64Image) {
        try {
            await waitForClientReady();
            console.log('Cliente de Discord está listo para enviar mensaje');
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) {
                throw new Error('Canal no encontrado');
            }
            console.log(`Canal obtenido: ${channel.name}`);

            const embed = new EmbedBuilder()
                .setColor(0x1E90FF) // Un color azul más suave
                .setTitle('📢 ¡Nuevo Anuncio! 📢')
                .setThumbnail('https://i.postimg.cc/ZRQ9wJXF/anuncio.png') // Imagen destacada
                .setAuthor({ name: 'Anuncios Importantes', iconURL: 'https://i.postimg.cc/ZRQ9wJXF/anuncio.png' })
                .addFields(
                    { name: 'ID del Usuario', value: `Usuario#${user_id}`, inline: true },
                    { name: 'Contenido', value: content }
                )
                .setFooter({ text: '¡Gracias por tu atención!' })
                .setTimestamp();

            // Convierte la imagen base64 en un buffer
            const imageBuffer = Buffer.from(base64Image, 'base64');

            // Añade la imagen al embed
            embed.setImage('attachment://image.png');

            // Envía el embed junto con la imagen
            await channel.send({ embeds: [embed], files: [{ attachment: imageBuffer, name: 'image.png' }] });
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