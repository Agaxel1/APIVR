const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.get('/', getAnuncios);
router.get('/user-anuncios', getUserAnuncios);
router.post('/', crearPost);
router.post('/delete-anuncio', deletePost);

async function getAnuncios(req, res) {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const tipo = req.query.tipo || "A";
    try {
        const { posts, total } = await controlador.anuncios(pagina, limite, tipo);
        const response = {
            content: posts,
            total,
            pagina,
            limite,
            totalPages: Math.ceil(total / limite),
        };
        respuestas.success(req, res, response, 200);
    } catch (err) {
        respuestas.error(req, res, err.message, 500); // Cambia a err.message para evitar posibles objetos de error
    }
}

async function getUserAnuncios(req, res) {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const userId = parseInt(req.query.userId);
    const name = req.query.name;
    const tipo = req.query.tipo || "A";
    try {
        const { posts, total } = await controlador.unAnuncio(pagina, limite, userId, name, tipo);
        const response = {
            content: posts,
            total,
            pagina,
            limite,
            totalPages: Math.ceil(total / limite),
        };
        respuestas.success(req, res, response, 200);
    } catch (err) {
        respuestas.error(req, res, err.message, 500); // Cambia a err.message para evitar posibles objetos de error
    }
}

async function crearPost(req, res) {
    try {
        const post = await controlador.crearPost(req.body);
        respuestas.success(req, res, "Agregado correctamente", 201);

        // Enviar el mensaje embebido a Discord sin interferir con la respuesta al cliente
        const { sendEmbedMessage } = require('../../discordClient');
        const embed = {
            title: "Nuevo Anuncio",
            description: `Se ha creado un nuevo anuncio con las siguientes características:`,
            fields: [
                { name: 'Título', value: post.title },
                { name: 'Descripción', value: post.description },
                { name: 'Precio', value: post.price.toString() },
                { name: 'Usuario', value: post.user }
            ],
            timestamp: new Date(),
        };

        // Envía el mensaje embebido de forma asíncrona y sin bloquear la respuesta HTTP
        sendEmbedMessage(embed).catch(console.error);
    } catch (err) {
        if (!res.headersSent) {
            respuestas.error(req, res, err.message, 500); // Cambia a err.message para evitar posibles objetos de error
        } else {
            console.error('Error después de que la respuesta ya fue enviada:', err);
        }
    }
}

async function deletePost(req, res) {
    const { postId } = req.body;
    try {
        await controlador.deletePost(postId);
        respuestas.success(req, res, "Post eliminado correctamente", 200);
    } catch (err) {
        respuestas.error(req, res, err.message, 500); // Cambia a err.message para evitar posibles objetos de error
    }
}

module.exports = router;
