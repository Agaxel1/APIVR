const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config');

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

async function sendMail(recipientEmail, body) {
    const transporter = nodemailer.createTransport(config.email);

    const mailOptions = {
        from: config.email.auth.user,
        to: recipientEmail,
        subject: 'Confirmación de Registro',
        html: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Correo electrónico enviado');
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
}

function Login(tabla, usuario, password) {
    return new Promise((resolve, reject) => {
        const query = `SELECT ID,Name,  Pass, Salt FROM ${tabla} WHERE Name = ?`;

        conexion.query(query, [usuario], (error, results) => {
            if (error) {
                return reject(error);
            }

            if (results.length === 0) {
                return reject('Usuario no encontrado');
            }

            const { Pass: hashedPassword, Salt: salt } = results[0];

            // Generar el hash de la contraseña ingresada usando el salt almacenado
            const hashToCompare = crypto.createHash('sha256').update(password + salt).digest('hex').toLowerCase();

            // Comparar el hash generado con el hash almacenado
            if (hashToCompare === hashedPassword.toLowerCase()) {
                resolve(results[0]);  // Contraseña correcta, devuelve los datos del usuario
            } else {
                reject('Contraseña incorrecta');  // Contraseña incorrecta
            }
        });
    });
}
async function registerUser(usuario, password, email) {
    return new Promise((resolve, reject) => {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex').toLowerCase();

        const insertQuery = 'INSERT INTO registro_pendiente (username, password_hash, email, token) VALUES (?, ?, ?, ?)';
        const confirmationLink = `https://api.vida-roleplay.com/api/logueo/confirm/${token}`;
        const emailBody = `
            <p>Hola ${usuario},</p>
            <p>Por favor, confirma tu registro haciendo clic en el siguiente enlace:</p>
            <a href="${confirmationLink}">Confirmar Registro</a>
        `;

        sendMail(email, emailBody)
            .then(() => {
                conexion.query(insertQuery, [usuario, hashedPassword, email, token], (err, result) => {
                    if (err) {
                        console.error('Error al insertar en la base de datos:', err);
                        return reject(err);
                    }
                    console.log('Usuario registrado exitosamente:', result);
                    resolve(result);
                });
            })
            .catch(err => {
                console.error('Error al enviar el correo:', err);
                reject(err);
            });
    });
}


function confirmUserRegistration(token) {
    return new Promise((resolve, reject) => {
        // Verificar si el token existe en la tabla `registro_pendiente`
        const selectQuery = 'SELECT * FROM registro_pendiente WHERE token = ?';
        conexion.query(selectQuery, [token], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length === 0) {
                return reject('Token de confirmación inválido o expirado');
            }

            // Extraer los datos del usuario
            const { username, password_hash, email } = results[0];

            // Insertar el usuario en la tabla de usuarios confirmados
            const insertQuery = 'INSERT INTO usuarios (username, password_hash, email) VALUES (?, ?, ?)';
            conexion.query(insertQuery, [username, password_hash, email], (err, result) => {
                if (err) {
                    return reject(err);
                }

                // Eliminar el registro de la tabla `registro_pendiente`
                const deleteQuery = 'DELETE FROM registro_pendiente WHERE token = ?';
                conexion.query(deleteQuery, [token], (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(result);
                });
            });
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
    registerUser,
    posts,
    anuncios,
    confirmUserRegistration,
    unAnuncio,
    unpost,
    likePost,
    unlikePost,
    crearPost,
    deletePost,
    emisoras,
    Trabajos,
};
