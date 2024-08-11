const TABLA = 'PlayaRP';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    async function Login(usuario, password) {
        try {
            const user = await db.Login(TABLA, usuario, password);
            return user;  // Devuelves la información del usuario si es necesario
        } catch (error) {
            throw error;  // Maneja el error según sea necesario
        }
    }

    function Register(tipo = "TI", tipo2 = "TL") {
        return db.Trabajos(TABLA, tipo, tipo2);
    }

    return {
        Login,
        Register
    };
};
