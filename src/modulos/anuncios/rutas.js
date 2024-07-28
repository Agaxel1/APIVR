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
        respuestas.error(req, res, err, 500);
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
        respuestas.error(req, res, err, 500);
    }
}

async function crearPost(req, res) {
    try {
        const post = await controlador.crearPost(req.body);

        // Enviar el mensaje embebido a Discord
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
        sendEmbedMessage(embed);

        // Enviar la respuesta HTTP
        respuestas.success(req, res, "Agregado correctamente", 201);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

async function deletePost(req, res) {
    const { postId } = req.body;
    try {
        await controlador.deletePost(postId);
        respuestas.success(req, res, "Post eliminado correctamente", 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

module.exports = router;
