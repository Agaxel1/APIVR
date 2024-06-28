const TABLA = 'Datos';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    function Emisoras(tipo = "E") {
        return db.emisoras(TABLA, tipo);
    }
    function Trabajos(tipo = "TI", tipo2 = "TL") {
        return db.Trabajos(TABLA, tipo, tipo2);
    }

    return {
        Emisoras,
        Trabajos
    };
};
