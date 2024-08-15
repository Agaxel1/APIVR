const TABLA = 'PlayaRP';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    async function findUserByEmail(email) {
        const user = await db.findUserByEmail(TABLA, email);
        return user;
    }

    async function generatePasswordResetToken(userId) {
        const expiration = Date.now() + 3600000; // 1 hora desde ahora

        // Llama a storePasswordResetToken y recibe el token generado
        const token = await db.storePasswordResetToken(userId, expiration);
        return token;
    }


    async function resetUserPassword(token, newPassword) {
        const resetInfo = await db.findResetToken(TABLA, token);

        if (!resetInfo || resetInfo.expiration < Date.now()) {
            throw new Error('Token inválido o expirado');
        }

        await db.updateUserPassword(resetInfo.user_id, newPassword);

        // Limpia el token después de usarlo
        await db.deleteResetToken(token);
    }

    async function sendMail(email, emailBody) {
        try {
            await db.sendMail(email, emailBody);
        } catch (error) {
            throw error;
        }
    }


    async function Login(req, usuario, password) {
        try {
            const user = await db.Login(TABLA, usuario, password);
            return user;
        } catch (error) {
            throw error;
        }
    }

    function Logout(req) {
        return new Promise((resolve, reject) => {
            req.session.destroy(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async function registerUser(username, email, password, sexo, nacionalidad, raza) {
        try {
            await db.registerUser(username, password, email, sexo, nacionalidad, raza);
            return;  // Puedes devolver algo si es necesario
        } catch (error) {
            throw error;
        }
    }

    async function confirmRegistration(token) {
        try {
            const result = await db.confirmUserRegistration(token);
            return result;
        } catch (error) {
            throw error;
        }
    }

    return {
        sendMail,
        resetUserPassword,
        generatePasswordResetToken,
        findUserByEmail,
        Login,
        Logout,
        registerUser,
        confirmRegistration
    };
};
