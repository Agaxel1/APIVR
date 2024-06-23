const TABLA = 'posts';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    function posts(pagina = 1, limite = 10) {
        return db.posts(TABLA, pagina, limite);
    }

    function unpost(pagina = 1, limite = 10, user = null, name = null) {
        return db.unpost(TABLA, pagina, limite, user, name);
    }

    function likePost(userId, userName, postId) {
        return db.likePost(userId, userName, postId);
    }

    function unlikePost(userId, userName, postId) {
        return db.unlikePost(userId, userName, postId);
    }

    function crearPost(body) {
        return db.crearPost(TABLA, body);
    }

    function deletePost(postId) {
        return db.deletePost(TABLA, postId);
    }

    return {
        posts,
        unpost,
        likePost,
        unlikePost,
        crearPost,
        deletePost
    };
};
