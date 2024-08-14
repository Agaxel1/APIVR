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


async function updateCertificationStatus(userID, Tipo) {
    return new Promise((resolve, reject) => {
        let query = '';

        // Determina el campo a actualizar según el valor de Tipo
        if (Tipo === 1) {
            query = 'UPDATE PlayaRP SET CertFacc = 1 WHERE ID = ?';
        } else if (Tipo === 2) {
            query = 'UPDATE PlayaRP SET CertUsuario = 1 WHERE ID = ?';
        } else {
            return reject(new Error('Tipo no válido'));
        }

        // Ejecuta la consulta
        conexion.query(query, [userID], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}



async function getLinks() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT nombre, link FROM links';
        conexion.query(query, (err, results) => {
            if (err) {
                return reject(err);
            }

            const links = {};
            results.forEach(link => {
                links[link.nombre] = link.link;
            });

            resolve(links);
        });
    });
}


async function getCertificationStatus(userID) {
    return new Promise((resolve, reject) => {
        const query = `SELECT CertUsuario, CertFacc FROM PlayaRP WHERE ID = ?`;
        conexion.query(query, [userID], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                const { CertUsuario, CertFacc } = results[0];
                resolve({
                    userCertified: CertUsuario === 1,
                    factionCertified: CertFacc === 1
                });
            } else {
                resolve({
                    userCertified: false,
                    factionCertified: false
                });
            }
        });
    });
}


function getTops(columna) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM PlayaRP ORDER BY ${columna} DESC LIMIT 10`;
        conexion.query(query, [], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                const headers = Object.keys(results[0]);
                const rows = results.map(row => headers.map(header => row[header]));

                resolve({
                    headers: headers,
                    rows: rows
                });
            } else {
                resolve({
                    headers: [],
                    rows: []
                });
            }
        });
    });
}



//Perfil
// Funciones de consulta para cada sección
function getFaccion(memberID) {
    return new Promise((resolve, reject) => {
        const query = `SELECT Name FROM LeaderInfo WHERE Leader = ?`;
        conexion.query(query, [memberID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]?.Name || 'No asignado');
        });
    });
}

function getAntecedentes(Name) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM Antecedentes WHERE Name = ?`;
        conexion.query(query, [Name], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

// Función para obtener multas
function getMultas(Name) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM Ticketsys WHERE Name = ?`;
        conexion.query(query, [Name], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

// Función principal para obtener estadísticas
async function getEstadisticas(userID, Name, tabla) {
    return new Promise(async (resolve, reject) => {
        const query = `SELECT * FROM ${tabla} WHERE ID = ?`;
        conexion.query(query, [userID], async (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                const estadisticas = results[0];

                // Obtener antecedentes y multas
                try {
                    estadisticas.Antecedentes = await getAntecedentes(Name);
                    estadisticas.Multas = await getMultas(Name);
                    estadisticas.Member = await getFaccion(estadisticas.Member);
                    resolve(estadisticas);
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve(null); // No se encontraron estadísticas
            }
        });
    });
}


function getModelos(model) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM car_table WHERE vehicleid = ?`;
        conexion.query(query, [model], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getAutos(userID, tabla) {
    return new Promise((resolve, reject) => {
        // Primera consulta: obtener los modelos de la tabla
        const query1 = `SELECT * FROM ${tabla} WHERE Owner = ?`;

        conexion.query(query1, [userID], async (err, results) => {
            if (err) {
                return reject(err);
            }

            // Obtener los modelos de la primera consulta
            const models = results.map(row => row.Model);

            // Segunda consulta: obtener los detalles de los modelos
            try {
                let cars = [];
                for (const model of models) {
                    const modelDetails = await getModelos(model);
                    cars = cars.concat(modelDetails);
                }

                // Devuelve los resultados combinados
                resolve({
                    autos: results,
                    modelos: cars
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}




function getNegocios(userID, tabla) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${tabla} WHERE Owner = ?`;
        conexion.query(query, [userID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getCasas(userID, tabla) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${tabla} WHERE Owner = ?`;
        conexion.query(query, [userID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

function getMovimientos(userID) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM banco WHERE Owner = ?';
        conexion.query(query, [userID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

//

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
        // Verificar el formato del correo electrónico
        if (!isValidEmail(email)) {
            return reject(new Error('El correo electrónico ingresado no es válido.'));
        }

        // Verificar si el correo ya está en PlayaRP
        const checkEmailInPlayaRPQuery = 'SELECT COUNT(*) AS count FROM PlayaRP WHERE Mail = ?';
        conexion.query(checkEmailInPlayaRPQuery, [email], (err, results) => {
            if (err) {
                console.error('Error al verificar el correo electrónico en PlayaRP:', err);
                return reject(new Error('Error al verificar el correo electrónico en PlayaRP.'));
            }

            if (results[0].count > 0) {
                return reject(new Error('El correo electrónico ya se encuentra registrado.'));
            }

            let salt = '';
            for (let i = 0; i < 10; i++) {
                salt += String.fromCharCode(Math.floor(Math.random() * 79) + 47);
            }

            // Crear el hash de la contraseña usando el salt y convertirlo a mayúsculas
            const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex').toUpperCase();

            const token = crypto.randomBytes(32).toString('hex');

            // Verificar si el correo ya está en registro_pendiente
            const checkEmailQuery = 'SELECT COUNT(*) AS count FROM registro_pendiente WHERE email = ?';
            conexion.query(checkEmailQuery, [email], (err, results) => {
                if (err) {
                    console.error('Error al verificar el correo electrónico en registro_pendiente:', err);
                    return reject(new Error('Error al verificar el correo electrónico en registro_pendiente.'));
                }

                if (results[0].count > 0) {
                    return reject(new Error('El correo electrónico ya está registrado.'));
                }

                // Guardar el usuario con el salt y el hash en la base de datos
                const insertQuery = 'INSERT INTO registro_pendiente (username, password_hash, salt, email, token) VALUES (?, ?, ?, ?, ?)';
                const confirmationLink = `https://api.vida-roleplay.com/api/logueo/confirm/${token}`;
                const emailBody = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Confirmación de Registro</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #1e1e1e; color: #e0e0e0;">
                        <div style="max-width: 600px; margin: 40px auto; background: #2b2b2b; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); text-align: center;">
                            <img src="https://i.postimg.cc/Px5Q8nPk/Imagen-de-Whats-App-2024-07-29-a-las-19-07-48-3caaf1fa.jpg" alt="Vida Roleplay" style="max-width: 150px; margin-bottom: 20px;">
                            <h1 style="color: #ffffff;">¡Hola ${usuario}!</h1>
                            <p style="color: #c0c0c0; line-height: 1.5;">Gracias por registrarte en Vida Roleplay. Para completar el proceso de registro, por favor confirma tu cuenta haciendo clic en el botón de abajo.</p>
                            <a href="${confirmationLink}" style="display: inline-flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 10px; padding: 14px 28px; font-size: 20px; font-weight: bold; background-color: #0069d9; color: #ffffff; text-decoration: none; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); transition: background-color 0.2s ease-in-out;">Confirmar Registro</a>
                            <p style="color: #c0c0c0;">Si no solicitaste este registro, por favor ignora este correo.</p>
                            <div style="font-size: 12px; color: #888888; margin-top: 20px;">
                                <p>&copy; 2024 Vida Roleplay. Todos los derechos reservados.</p>
                                <p><img src="https://i.postimg.cc/XJ1cf1CB/email.png" alt="Email Icon" style="width: 24px; vertical-align: middle; margin-right: 8px;"> Si tienes problemas, contacta con soporte.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                sendMail(email, emailBody)
                    .then(() => {
                        conexion.query(insertQuery, [usuario, hashedPassword, salt, email, token], (err, result) => {
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
                        reject(new Error('Error al enviar el correo electrónico. Verifica el correo ingresado.'));
                    });
            });
        });
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    updateCertificationStatus,
    getLinks,
    getTops,
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
    getEstadisticas,
    getAutos,
    getNegocios,
    getCasas,
    getMovimientos,
    getCertificationStatus
};
