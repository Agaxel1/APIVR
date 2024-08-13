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
            return;
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

    async function certifyUser(userID, Tipo) {
        try {
            const result = await db.updateCertificationStatus(userID, Tipo);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Aquí agregamos las funciones faltantes
    async function getLinks() {
        try {
            const links = await db.getLinks();
            return links;
        } catch (error) {
            throw error;
        }
    }

    async function getTops() {
        try {
            const tops = await db.getTops();
            return tops;
        } catch (error) {
            throw error;
        }
    }

    async function getEstadisticas(userID, Name) {
        try {
            const estadisticas = await db.getEstadisticas(userID, Name);
            return estadisticas;
        } catch (error) {
            throw error;
        }
    }

    async function getAutos(userID) {
        try {
            const autos = await db.getAutos(userID);
            return autos;
        } catch (error) {
            throw error;
        }
    }

    async function getNegocios(userID) {
        try {
            const negocios = await db.getNegocios(userID);
            return negocios;
        } catch (error) {
            throw error;
        }
    }

    async function getCasas(userID) {
        try {
            const casas = await db.getCasas(userID);
            return casas;
        } catch (error) {
            throw error;
        }
    }

    async function getMovimientos(userID) {
        try {
            const movimientos = await db.getMovimientos(userID);
            return movimientos;
        } catch (error) {
            throw error;
        }
    }

    return {
        Login,
        Logout,
        registerUser,
        confirmRegistration,
        certifyUser,
        getLinks,
        getTops,
        getEstadisticas,
        getAutos,
        getNegocios,
        getCasas,
        getMovimientos,
    };
};
