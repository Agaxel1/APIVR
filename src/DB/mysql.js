const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config');
const sampQuery = require('samp-query');
const { client, waitForClientReady } = require('../discordClient');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();
const CHANNEL_ID_HISTORIA = process.env.DISCORD_CHANNEL_ID_HISTORIA;

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

async function updateUserChangeName(tabla, userID, newCharacterName) {
    return new Promise((resolve, reject) => {
        // Verificar si el nombre ya existe
        const checkNameQuery = `SELECT COUNT(*) AS count FROM ${tabla} WHERE Name = ?`;
        const checkNameParams = [newCharacterName];
        const PrecioNombre = 100;

        conexion.query(checkNameQuery, checkNameParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            const nameExists = results[0].count > 0;
            if (nameExists) {
                return resolve("El nombre ya existe. Elija otro.");
            }

            // Obtener detalles del usuario
            const getUserDetailsQuery = `SELECT Name, Online, Crystal FROM ${tabla} WHERE ID = ?`;
            const getUserDetailsParams = [userID];

            conexion.query(getUserDetailsQuery, getUserDetailsParams, (err, results) => {
                if (err) {
                    return reject(err);
                }

                const user = results[0];
                if (user.Online === 1) {
                    return resolve("No se puede cambiar el nombre mientras estás conectado al servidor.\nDesconéctate /quit");
                }

                const newCrystalAmount = user.Crystal - PrecioNombre;
                if (newCrystalAmount < 0) {
                    return resolve("No tienes suficientes Coins para cambiar el nombre.");
                }

                // Actualizar el nombre y ajustar los créditos de Crystal
                const updateQuery = `UPDATE ${tabla} SET Name = ?, Crystal = Crystal - ${PrecioNombre}, historia = NULL, permisoName = 0 WHERE ID = ?`;
                const updateParams = [newCharacterName, userID];

                conexion.query(updateQuery, updateParams, (err, results) => {
                    if (err) {
                        return reject(err);
                    }

                    // Eliminar el registro en la tabla Antecedentes
                    const deleteAntecedentesQuery = `DELETE FROM Antecedentes WHERE Name = ?`;
                    const deleteAntecedentesParams = [user.Name];

                    conexion.query(deleteAntecedentesQuery, deleteAntecedentesParams, (err, results) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve("Nombre del personaje actualizado correctamente.");
                    });
                });
            });
        });
    });
}




function getHistoriaDetalles(tabla, id) {
    return new Promise((resolve, reject) => {
        const query = `SELECT Owner, Historia, fecha FROM ${tabla} WHERE ID = ?`;
        const params = [id];

        conexion.query(query, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]); // Debe devolver un solo registro
        });
    });
}

// Función para dividir una historia en varias partes si excede 1024 caracteres
function dividirHistoriaEnPartes(historia, maxLength = 1024) {
    const partes = [];
    for (let i = 0; i < historia.length; i += maxLength) {
        partes.push(historia.slice(i, i + maxLength));
    }
    return partes;
}

async function enviarMensajeDiscord(ownerID, ownerName, historia, adminID, adminName) {
    try {
        // Asegúrate de que el cliente de Discord esté listo
        await waitForClientReady();
        console.log('Cliente de Discord está listo para enviar mensaje');

        // Obtener el canal
        const channel = await client.channels.fetch(CHANNEL_ID_HISTORIA);
        if (!channel) {
            throw new Error('Canal no encontrado');
        }
        console.log(`Canal obtenido: ${channel.name}`);

        // Dividir la historia en partes si excede los 1024 caracteres
        const historiaPartes = dividirHistoriaEnPartes(historia);

        // Crear el embed
        const embed = new EmbedBuilder()
            .setTitle(`Historia Aprobada de ${ownerName}#${ownerID}`)
            .setDescription(`La historia ha sido aprobada por el administrador/profesor **${adminName}#${adminID}**.`)
            .setColor(0x00FF00) // Color verde para indicar aprobación
            .setTimestamp() // Añadir el tiempo actual
            .setFooter({ text: 'Sistema de Aprobación de Historias' });

        // Añadir cada parte de la historia al embed
        historiaPartes.forEach((parte) => {
            embed.addFields({ name: '\u200B', value: parte });
        });

        // Enviar el embed al canal
        await channel.send({ embeds: [embed] });

        console.log('Mensaje enviado a Discord');
    } catch (error) {
        console.error('Error al enviar mensaje a Discord:', error);
    }
}

async function decisionHistoria(playa, tablaHistoria, id, decision, admin) {
    return new Promise((resolve, reject) => {
        if (decision !== 'aprobar' && decision !== 'rechazar') {
            return reject(new Error('Decisión no válida.'));
        }

        // Obtener los detalles de la historia y el dueño
        const getHistoriaAndOwnerQuery = `
            SELECT h.ID, h.Owner, h.historia, p.Name as ownerName 
            FROM ${tablaHistoria} h
            JOIN ${playa} p ON h.Owner = p.ID
            WHERE h.ID = ?`;
        conexion.query(getHistoriaAndOwnerQuery, [id], (err, historiaResults) => {
            if (err) {
                return reject(err);
            }

            const historia = historiaResults[0];
            if (!historia) {
                return reject(new Error('Historia no encontrada.'));
            }

            // Obtener el nombre del admin
            const getAdminNameQuery = `SELECT Name FROM ${playa} WHERE ID = ?`;
            conexion.query(getAdminNameQuery, [admin], (err, adminResults) => {
                if (err) {
                    return reject(err);
                }

                const adminData = adminResults[0];
                if (!adminData) {
                    return reject(new Error('Admin no encontrado.'));
                }

                const adminName = adminData.Name;

                if (decision === 'aprobar') {
                    // Aprobar la historia
                    const updatePlayaQuery = `UPDATE ${playa} SET historia = ? WHERE ID = ?`;
                    conexion.query(updatePlayaQuery, [historia.historia, historia.Owner], (err) => {
                        if (err) {
                            return reject(err);
                        }

                        const deleteHistoriaQuery = `DELETE FROM ${tablaHistoria} WHERE ID = ?`;
                        conexion.query(deleteHistoriaQuery, [id], async (err) => {
                            if (err) {
                                return reject(err);
                            }

                            // Enviar mensaje a Discord
                            try {
                                await enviarMensajeDiscord(historia.Owner, historia.ownerName, historia.historia, admin, adminName);
                                resolve({ message: 'Historia aprobada con éxito.' });
                            } catch (discordError) {
                                reject(discordError);
                            }
                        });
                    });
                } else if (decision === 'rechazar') {
                    // Rechazar la historia
                    const deleteHistoriaQuery = `DELETE FROM ${tablaHistoria} WHERE ID = ?`;
                    conexion.query(deleteHistoriaQuery, [id], (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve({ message: 'Historia rechazada con éxito.' });
                    });
                }
            });
        });
    });
}



function getHistorias(tabla) {
    return new Promise((resolve, reject) => {
        let query = `SELECT ID, Owner, Historia, fecha FROM ${tabla} ORDER BY fecha DESC`;
        let params = [];

        conexion.query(query, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

async function SendHistoryAprove(tabla, userId, historia) {
    return new Promise((resolve, reject) => {
        // Verificar si ya existe una historia pendiente para el userId
        let query = `SELECT * FROM ${tabla} WHERE Owner = ?`;
        let params = [userId];

        conexion.query(query, params, (error, results) => {
            if (error) {
                return reject('Error al verificar la historia.');
            }

            if (results.length > 0) {
                // Ya existe una historia pendiente
                resolve('Ya has enviado tu historia. Debes esperar a que se apruebe o rechace.');
            } else {
                // Obtener la fecha y hora actual
                let fechaActual = new Date();

                // Restar 5 horas
                fechaActual.setHours(fechaActual.getHours() - 5);

                // Formatear la fecha en el formato YYYY-MM-DD HH:MM:SS
                fechaActual = fechaActual.toISOString().slice(0, 19).replace('T', ' ');

                // Insertar la nueva historia
                query = `INSERT INTO ${tabla} (Owner, Historia, fecha) VALUES (?, ?, ?)`;
                params = [userId, historia, fechaActual];

                conexion.query(query, params, (insertError) => {
                    if (insertError) {
                        return reject('Error al enviar la historia. Intenta de nuevo más tarde.');
                    }

                    resolve('Tu historia ha sido enviada y está en revisión.');
                });
            }
        });
    });
}




function getQuestions(type) {
    return new Promise((resolve, reject) => {
        let query = "SELECT id, question, option1, option2, option3, option4, correct FROM Questions";
        let params = [];

        if (type) {
            query += " WHERE type = ?";
            params.push(type);
        }

        conexion.query(query, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}


/*****Contraseña olvidada*****/

function findUserByEmail(tabla, email) {
    return new Promise((resolve, reject) => {
        const query = `SELECT ID, Name, Warn FROM ${tabla} WHERE Mail = ?`;
        conexion.query(query, [email], (error, results) => {
            if (error) return reject(error);
            if (results.length === 0) return resolve(null);
            resolve(results[0]);
        });
    });
}


function storePasswordResetToken(userId, expiration) {
    const token = crypto.randomBytes(32).toString('hex');
    const formattedExpiration = new Date(expiration).toISOString().slice(0, 19).replace('T', ' '); // Formato YYYY-MM-DD HH:MM:SS

    return new Promise((resolve, reject) => {
        const query = `INSERT INTO password_resets (user_id, token, expiration) VALUES (?, ?, ?)`;
        conexion.query(query, [userId, token, formattedExpiration], (error) => {
            if (error) return reject(error);
            resolve(token);
        });
    });
}


function findResetToken(tabla, token) {
    return new Promise((resolve, reject) => {
        const query = `SELECT user_id, expiration FROM password_resets WHERE token = ?`;
        conexion.query(query, [token], (error, results) => {
            if (error) return reject(error);
            if (results.length === 0) return resolve(null);
            resolve(results[0]);
        });
    });
}

async function updateUserPassword(userId, newPassword) {
    return new Promise((resolve, reject) => {
        // Generar un nuevo salt
        let salt = '';
        for (let i = 0; i < 10; i++) {
            salt += String.fromCharCode(Math.floor(Math.random() * 79) + 47);
        }

        // Crear el hash de la nueva contraseña
        const hashedPassword = crypto.createHash('sha256').update(newPassword + salt).digest('hex').toUpperCase();

        // Actualizar la contraseña en la base de datos
        const query = `UPDATE PlayaRP SET Pass = ?, Salt = ? WHERE ID = ?`;
        conexion.query(query, [hashedPassword, salt, userId], (error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}


async function updateUserChangePassword(tabla, userID, currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
        const query1 = `SELECT ID, Name, Pass, Salt FROM PlayaRP WHERE ID = ?`;

        conexion.query(query1, [userID], (error, results) => {
            if (error) {
                return reject(error);
            }

            if (results.length === 0) {
                return reject('Usuario no encontrado');
            }

            const { Pass: hashedPassword, Salt: storedSalt } = results[0];

            // Generar el hash de la contraseña actual usando el salt almacenado
            const hashToCompare = crypto.createHash('sha256').update(currentPassword + storedSalt).digest('hex').toUpperCase();

            // Comparar el hash generado con el hash almacenado
            if (hashToCompare !== hashedPassword.toUpperCase()) {
                return reject('Contraseña incorrecta');
            }

            // Si la contraseña actual es correcta, generar un nuevo salt y actualizar la contraseña
            let newSalt = '';
            for (let i = 0; i < 10; i++) {
                newSalt += String.fromCharCode(Math.floor(Math.random() * 79) + 47);
            }

            // Crear el hash de la nueva contraseña
            const newHashedPassword = crypto.createHash('sha256').update(newPassword + newSalt).digest('hex').toUpperCase();

            // Actualizar la contraseña en la base de datos
            const query2 = `UPDATE ${tabla} SET Pass = ?, Salt = ? WHERE ID = ?`;
            conexion.query(query2, [newHashedPassword, newSalt, userID], (error) => {
                if (error) return reject(error);
                resolve('Contraseña actualizada correctamente');
            });
        });
    });
}

function deleteResetToken(token) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM password_resets WHERE token = ?`;
        conexion.query(query, [token], (error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}

/*********************** */


const serverOptions = {
    host: config.samp.host, // Usando la IP desde config.js
    port: config.samp.port // Usando el puerto desde config.js
};


async function getServerStatusmysql() {
    return new Promise((resolve, reject) => {
        sampQuery(serverOptions, (error, response) => {
            if (error) {
                console.error("Error al consultar el servidor SAMP:", error);
                return resolve({ error: true, body: "Host unavailable" });
            }
            resolve({ error: false, body: response });
        });
    });
}



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
        const query = `SELECT ID,Name, Admin,  Pass, Salt FROM ${tabla} WHERE Name = ?`;

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

async function registerUser(usuario, password, email, sexo, nacionalidad, raza) {
    return new Promise((resolve, reject) => {

        // Verificar el formato del correo electrónico
        if (!isValidEmail(email)) {
            return reject(new Error('El correo electrónico ingresado no es válido.'));
        }

        // Verificar si el correo ya está en PlayaRP y si el usuario ya existe en PlayaRP o en registro_pendiente
        const checkQueries = [
            'SELECT COUNT(*) AS count FROM PlayaRP WHERE Mail = ?',
            'SELECT COUNT(*) AS count FROM PlayaRP WHERE Name = ?',
            'SELECT COUNT(*) AS count FROM registro_pendiente WHERE email = ?',
            'SELECT COUNT(*) AS count FROM registro_pendiente WHERE username = ?'
        ];

        // Ejecutar las consultas en paralelo
        Promise.all([
            new Promise((resolve, reject) => {
                conexion.query(checkQueries[0], [email], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            }),
            new Promise((resolve, reject) => {
                conexion.query(checkQueries[1], [usuario], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            }),
            new Promise((resolve, reject) => {
                conexion.query(checkQueries[2], [email], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            }),
            new Promise((resolve, reject) => {
                conexion.query(checkQueries[3], [usuario], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            })
        ])
            .then(([emailInPlayaRP, userInPlayaRP, emailInPending, userInPending]) => {
                if (emailInPlayaRP) {
                    return reject(new Error('El correo electrónico ya se encuentra registrado.'));
                }
                if (userInPlayaRP) {
                    return reject(new Error('El nombre de usuario ya está registrado, usa otro.'));
                }
                if (emailInPending) {
                    return reject(new Error('El correo electrónico está en proceso de registro.'));
                }
                if (userInPending) {
                    return reject(new Error('El nombre de usuario está en proceso de registro, usa otro.'));
                }

                let salt = '';
                for (let i = 0; i < 10; i++) {
                    salt += String.fromCharCode(Math.floor(Math.random() * 79) + 47);
                }

                // Crear el hash de la contraseña usando el salt y convertirlo a mayúsculas
                const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex').toUpperCase();

                const token = crypto.randomBytes(32).toString('hex');

                // Guardar el usuario con el salt y el hash en la base de datos
                const insertQuery = 'INSERT INTO registro_pendiente (email, username, password_hash, salt, Gorod, Sex,Race, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
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
                        <img src="https://i.postimg.cc/k5rg5Z7X/logo.png" alt="Vida Roleplay" style="max-width: 150px; margin-bottom: 20px;">
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
                        conexion.query(insertQuery, [email, usuario, hashedPassword, salt, nacionalidad, sexo, raza, token], (err, result) => {
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
            })
            .catch(err => {
                console.error('Error al verificar los datos:', err);
                reject(new Error('Error al verificar la existencia de usuario o correo electrónico.'));
            });
    });
}


function isValidEmail(email) {
    // Expresión regular para validar el formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Verificar si el formato del correo electrónico es válido
    if (!emailRegex.test(email)) {
        return false;
    }

    // Convertir el correo a minúsculas para hacer la comparación
    const lowerCaseEmail = email.toLowerCase();

    // Verificar si el correo pertenece a uno de los dominios permitidos
    const allowedDomains = ['hotmail.com', 'gmail.com', 'outlook.com'];
    const domain = lowerCaseEmail.split('@')[1];

    return allowedDomains.includes(domain);
}


function confirmUserRegistration(token) {
    return new Promise((resolve, reject) => {
        // Verificar si el token existe en la tabla `registro_pendiente`
        const selectQuery = 'SELECT * FROM registro_pendiente WHERE token = ?';
        const MoneyVR = 2000;
        const Bank = 5000;
        const X = '1728.48';
        const Y = '-1912.15';
        const Z = '13.5633';
        const A = '99.446';
        const Inventory = '241|1|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0';
        const Health = 100.00;

        conexion.query(selectQuery, [token], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length === 0) {
                return reject('Token de confirmación inválido o expirado');
            }

            // Extraer los datos del usuario
            const { username, email, password_hash, Salt, Gorod, Sex, Race } = results[0];

            // Asignar el valor de Skin según el valor de Sex
            let Skin = (Sex === 1) ? 26 : 13;

            // Insertar el usuario en la tabla de PlayaRP confirmados
            const insertQuery = `
                INSERT INTO PlayaRP (
                    Name, Mail, Pass, Salt, Sex, Race, MoneyVR, Skin, Level, Eat, Need, Soif, Sleep, Higiene, Diversion, Shame, Enfermedad, Alcohol, X, Y, Z, A, Inventory, Health, Gorod, Bank
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, 0, 100, 100, 100, 100, 100, 100, 100, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?
                )
            `;

            conexion.query(insertQuery, [username, email, password_hash, Salt, Sex, Race, MoneyVR, Skin, X, Y, Z, A, Inventory, Health, Gorod, Bank], (err, result) => {
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
    updateUserChangeName,
    decisionHistoria,
    getHistoriaDetalles,
    getHistorias,
    SendHistoryAprove,
    getQuestions,
    sendMail,
    findUserByEmail,
    storePasswordResetToken,
    findResetToken,
    updateUserPassword,
    updateUserChangePassword,
    deleteResetToken,
    getServerStatusmysql,
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
