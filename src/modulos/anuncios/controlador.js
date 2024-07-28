const db = require('../../DB/mysql');

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

    async function crearPost(body) {
        const post = await db.crearPost(TABLA, body);
        return post;
    }

    function deletePost(postId) {
        return db.deletePost(TABLA, postId);
    }

    return {
        anuncios,
        unAnuncio,
        crearPost,
        deletePost
    };
};
