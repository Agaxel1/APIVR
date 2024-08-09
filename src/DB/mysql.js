const mysql = require('mysql');
const config = require('../config');
const crypto = require('crypto');

const dbconfig = {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
};

let conexion;

function conmysql() {
    conexion = mysql.createConnection(dbconfig);

    conexion.connect((err) => {
        if (err) {
            console.log('[db err]', err);
            setTimeout(conmysql, 200);
        } else {
            console.log('Conectado a la base de datos');
        }
    });

    conexion.on('error', err => {
        console.log('[db err]', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            conmysql();
        } else {
            throw err;
        }
    });
}

conmysql();

//**Logueo */
function hashPassword(password, salt) {
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}


function Login(tabla, usuario, password) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ?? WHERE Name = ?`;

        // Ejecutar la consulta para obtener el usuario
        conexion.query(query, [tabla, usuario], (err, rows) => {
            if (err) {
                return reject(err);
            }

            if (rows.length === 0) {
                return resolve({ success: false, message: 'Usuario no encontrado' });
            }

            const user = rows[0];
            const storedSalt = user.Salt;
            const storedHash = user.Pass;

            // Crear el hash de la contraseña ingresada usando el salt almacenado
            const hashedPassword = hashPassword(password, storedSalt);

            if (hashedPassword === storedHash) {
                // Contraseña correcta
                resolve({ success: true, message: 'Inicio de sesión exitoso', user: user });
            } else {
                // Contraseña incorrecta
                resolve({ success: false, message: 'Contraseña incorrecta' });
            }
        });
    });
}


function posts(tabla, pagina = 1, limite = 10) {
    return new Promise((resolve, reject) => {
        // Calcular el offset para obtener los registros en orden inverso
        const offset = Math.max(0, (pagina - 1) * limite);

        // Consulta SQL para obtener los posts en orden inverso por id
        const query = `SELECT * FROM ?? ORDER BY id DESC LIMIT ? OFFSET ?`;

        // Consulta para obtener el total de registros
        const countQuery = `SELECT COUNT(*) AS total FROM ??`;

        // Ejecutar la consulta principal
        conexion.query(query, [tabla, limite, offset], (err, rows) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para obtener el total de registros
            conexion.query(countQuery, [tabla], (err, result) => {
                if (err) {
                    return reject(err);
                }

                const total = result[0].total;
                resolve({ posts: rows, total });
            });
        });
    });
}



function unpost(tabla, pagina = 1, limite = 10, userID = null, userName = null) {
    return new Promise((resolve, reject) => {
        // Calcular el offset para obtener los registros en orden inverso
        const offset = Math.max(0, (pagina - 1) * limite);

        // Consulta SQL para obtener los posts en orden inverso por id y filtrados por userID y userName
        const query = `SELECT * FROM ?? WHERE user_id = ? AND Name = ? ORDER BY id DESC LIMIT ? OFFSET ?`;

        // Consulta para obtener el total de registros filtrados por userID y userName
        const countQuery = `SELECT COUNT(*) AS total FROM ?? WHERE user_id = ? AND Name = ?`;

        // Ejecutar la consulta principal
        conexion.query(query, [tabla, userID, userName, limite, offset], (err, rows) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para obtener el total de registros
            conexion.query(countQuery, [tabla, userID, userName], (err, result) => {
                if (err) {
                    return reject(err);
                }

                const total = result[0].total;
                resolve({ posts: rows, total });
            });
        });
    });
}

function likePost(userId, userName, postId) {
    return new Promise((resolve, reject) => {
        // Construir la consulta SQL para incrementar el contador de likes
        const updateLikesQuery = 'UPDATE `posts` SET `likes` = `likes` + 1 WHERE `id` = ?';

        // Construir la consulta SQL para insertar el like en la tabla user_likes
        const insertLikeQuery = 'INSERT INTO `user_likes` (`user_id`, `user_name`, `post_id`) VALUES (?, ?, ?)';

        // Ejecutar la consulta para incrementar el contador de likes
        conexion.query(updateLikesQuery, [postId], (err, result) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para insertar el like en la tabla user_likes
            conexion.query(insertLikeQuery, [userId, userName, postId], (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    });
}

function unlikePost(userId, userName, postId) {
    return new Promise((resolve, reject) => {
        // Construir la consulta SQL para decrementar el contador de likes
        const updateLikesQuery = 'UPDATE `posts` SET `likes` = `likes` - 1 WHERE `id` = ?';

        // Construir la consulta SQL para eliminar el like de la tabla user_likes
        const deleteLikeQuery = 'DELETE FROM `user_likes` WHERE `user_id` = ? AND `user_name` = ? AND `post_id` = ?';

        // Ejecutar la consulta para decrementar el contador de likes
        conexion.query(updateLikesQuery, [postId], (err, result) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para eliminar el like de la tabla user_likes
            conexion.query(deleteLikeQuery, [userId, userName, postId], (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    });
}

function deletePost(tabla, postId) {
    return new Promise((resolve, reject) => {
        const deletePostQuery = `DELETE FROM ?? WHERE id = ?`;

        // Primero, elimina el post de la tabla correspondiente
        conexion.query(deletePostQuery, [tabla, postId], (err, result) => {
            if (err) {
                return reject(err);
            }

            // Si la tabla es 'posts', también elimina los registros en 'user_likes'
            if (tabla === 'posts') {
                const deleteLikesQuery = `DELETE FROM user_likes WHERE post_id = ?`;
                conexion.query(deleteLikesQuery, [postId], (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            } else {
                resolve(result); // Si no es 'posts', solo resolvemos con el resultado de eliminar el post
            }
        });
    });
}


function anuncios(tabla, pagina = 1, limite = 10, tipo = "A") {
    return new Promise((resolve, reject) => {
        // Calcular el offset para obtener los registros en orden inverso
        const offset = Math.max(0, (pagina - 1) * limite);

        // Consulta SQL para obtener los anuncios en orden inverso
        const query = `SELECT * FROM ?? WHERE Tipo = ? ORDER BY id DESC LIMIT ? OFFSET ?`;

        // Consulta para obtener el total de registros
        const countQuery = `SELECT COUNT(*) AS total FROM ?? WHERE Tipo = ?`;

        // Ejecutar la consulta principal
        conexion.query(query, [tabla, tipo, limite, offset], (err, rows) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para obtener el total de registros
            conexion.query(countQuery, [tabla, tipo], (err, result) => {
                if (err) {
                    return reject(err);
                }

                const total = result[0].total;
                resolve({ posts: rows, total });
            });
        });
    });
}

function unAnuncio(tabla, pagina = 1, limite = 10, userID = null, userName = null, tipo = "A") {
    return new Promise((resolve, reject) => {
        // Calcular el offset para obtener los registros en orden inverso
        const offset = Math.max(0, (pagina - 1) * limite);

        // Consulta SQL para obtener los posts en orden inverso por id y filtrados por userID y userName
        const query = `SELECT * FROM ?? WHERE user_id = ? AND Name = ? AND Tipo = ? ORDER BY id DESC LIMIT ? OFFSET ?`;

        // Consulta para obtener el total de registros filtrados por userID y userName
        const countQuery = `SELECT COUNT(*) AS total FROM ?? WHERE user_id = ? AND Name = ? AND Tipo = ?`;

        // Ejecutar la consulta principal
        conexion.query(query, [tabla, userID, userName, tipo, limite, offset], (err, rows) => {
            if (err) {
                return reject(err);
            }

            // Ejecutar la consulta para obtener el total de registros
            conexion.query(countQuery, [tabla, userID, userName, tipo], (err, result) => {
                if (err) {
                    return reject(err);
                }

                const total = result[0].total;
                resolve({ posts: rows, total });
            });
        });
    });
}


function crearPost(tabla, data) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO ${mysql.escapeId(tabla)} SET ?`;
        conexion.query(query, data, (err, rows) => {
            return err ? reject(err) : resolve(rows);
        });
    });
}


function emisoras(tabla, tipo = "E") {
    return new Promise((resolve, reject) => {

        // Consulta SQL para obtener los posts en orden inverso por id
        const query = `SELECT * FROM ?? WHERE Tipo = ?`;


        // Ejecutar la consulta principal
        conexion.query(query, [tabla, tipo], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve({ emisoras: rows });
        });
    });
}


function Trabajos(tabla, tipo = "TI", tipo2 = "TL") {
    return new Promise((resolve, reject) => {

        // Consulta SQL para obtener los posts en orden inverso por id
        const query = `SELECT * FROM ?? WHERE Tipo IN (? , ?)`;


        // Ejecutar la consulta principal
        conexion.query(query, [tabla, tipo, tipo2], (err, rows) => {
            if (err) {
                return reject(err);
            }

            resolve({ trabajos: rows });
        });
    });
}

module.exports = {
    Login,
    posts,
    anuncios,
    unAnuncio,
    unpost,
    likePost,
    unlikePost,
    crearPost,
    deletePost,
    emisoras,
    Trabajos,
};
