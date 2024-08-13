const TABLA = 'PlayaRP';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
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

    async function registerUser(username, email, password, token) {
        try {
            await db.registerUser(username, password, email, token);
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
        Login,
        Logout,
        registerUser,
        confirmRegistration
    };
};
