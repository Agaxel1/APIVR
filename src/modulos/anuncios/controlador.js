require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const { client, waitForClientReady } = require('../../discordClient'); // Ajusta la ruta según tu estructura
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // Asegúrate de que este ID sea el correcto
const CHANNEL_ID_DEEP = process.env.DISCORD_CHANNEL_ID;

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
    
            // Selecciona el canal adecuado según el tipo
            let channelId;
            if (tipo === "A") {
                channelId = CHANNEL_ID; // Canal para anuncios
            } else if (tipo === "D") {
                channelId = CHANNEL_ID_DEEP; // Canal para deep web
            } else {
                throw new Error('Tipo de mensaje no reconocido');
            }
            console.log(`Canal ID utilizado para tipo "${tipo}": ${channelId}`);
    
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                throw new Error('Canal no encontrado');
            }
            console.log(`Canal obtenido: ${channel.name}`);
    
            // Crear el embed base
            let embed = new EmbedBuilder().setTimestamp();
    
            if (tipo === "A") {
                embed
                    .setColor(0x1E90FF) // Un color azul más suave
                    .setTitle('📢 ¡Nuevo Anuncio! 📢')
                    .setThumbnail('https://i.postimg.cc/ZRQ9wJXF/anuncio.png') // Imagen destacada
                    .setAuthor({ name: 'Anuncios Importantes', iconURL: 'https://i.postimg.cc/ZRQ9wJXF/anuncio.png' })
                    .addFields(
                        { name: 'ID del Usuario', value: `Usuario#${user_id}`, inline: true },
                        { name: 'Contenido', value: content }
                    )
                    .setFooter({ text: '¡Gracias por tu atención!' });
            } else if (tipo === "D") {
                embed
                    .setColor(0xFF4500) // Un color naranja oscuro
                    .setTitle('💀 ¡Nuevo Post en DeepWeb! 💀')
                    .setThumbnail('https://i.postimg.cc/xdVc9C9p/deepweb.png') // Imagen destacada para DeepWeb
                    .setAuthor({ name: 'DeepWeb Noticias', iconURL: 'https://i.postimg.cc/xdVc9C9p/deepweb.png' })
                    .addFields(
                        { name: 'ID del Usuario', value: `Usuario#${user_id}`, inline: true },
                        { name: 'Contenido', value: content }
                    )
                    .setFooter({ text: 'Mantén la discreción...' });
            }
    
            // Solo añade la imagen si base64Image tiene valor
            let files = [];
            if (base64Image && base64Image.trim() !== '') {
                // Convierte la imagen base64 en un buffer
                const imageBuffer = Buffer.from(base64Image, 'base64');
                files.push({ attachment: imageBuffer, name: 'image.png' });
                embed.setImage('attachment://image.png');
            }
    
            // Envía el embed junto con la imagen, si hay archivos
            await channel.send({ embeds: [embed], files: files });
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