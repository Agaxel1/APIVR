const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.get('/', getPosts);
router.get('/user-posts', getUserPosts);
router.post('/', crearPost);
router.post('/delete-post', deletePost);
router.post('/like', likePost);
router.post('/unlike', unlikePost);

async function getPosts(req, res) {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    try {
        const { posts, total } = await controlador.posts(pagina, limite);
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

async function getUserPosts(req, res) {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const userId = parseInt(req.query.userId);
    const name = req.query.name;
    try {
        const { posts, total } = await controlador.unpost(pagina, limite, userId, name);
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

async function likePost(req, res) {
    const { userId, userName, postId } = req.body;
    try {
        const result = await controlador.likePost(userId, userName, postId);
        respuestas.success(req, res, "Like agregado correctamente", 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

async function unlikePost(req, res) {
    const { userId, userName, postId } = req.body;
    try {
        const result = await controlador.unlikePost(userId, userName, postId);
        respuestas.success(req, res, "Like eliminado correctamente", 200);
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

async function crearPost(req, res) {
    try {
        const { image_url, ...rest } = req.body;
        console.log("Recibiendo datos:", { contentLength: req.headers['content-length'], imageSize: image_url ? Buffer.byteLength(image_url, 'base64') : 'No image' });

        if (image_url) {
            const imageSizeInBytes = Buffer.byteLength(image_url, 'base64');
            if (imageSizeInBytes > 10 * 1024 * 1024) { // Límite de 10MB
                return respuestas.error(req, res, "Imagen muy grande", 413);
            }
        }

        const post = await controlador.crearPost(req.body);
        respuestas.success(req, res, "Agregado correctamente", 201);
    } catch (err) {
        console.error("Error al crear el post:", err); // Log para depurar errores
        respuestas.error(req, res, err, 500);
    }
}


module.exports = router;
