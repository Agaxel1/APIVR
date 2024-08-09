const TABLA = 'PlayaRP';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    function Login(usuario, password) {
        return db.Login(TABLA, usuario, password);
    }
    function Register(tipo = "TI", tipo2 = "TL") {
        return db.Trabajos(TABLA, tipo, tipo2);
    }

    return {
        Login,
        Register
    };
};
