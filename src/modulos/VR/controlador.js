const TABLA_ESTADISTICAS = 'PlayaRP';
const TABLA_AUTOS = 'Car';
const TABLA_NEGOCIOS = {
    GlobalInfo: 'global',
    Shop24: 'shop24',
    Salon: 'salon',
    GasStations: 'gas'
};

const TABLA_CASAS = 'House';

module.exports = function (dbInyectada) {
    let db = dbInyectada;

    if (!db) {
        db = require('../../DB/mysql');
    }

    // Funciones de controladores
    async function getEstadisticas(userID, Name) {
        try {
            const estadisticas = await db.getEstadisticas(userID,Name, TABLA_ESTADISTICAS);
            return estadisticas;
        } catch (error) {
            throw error;
        }
    }

    async function getAutos(userID) {
        try {
            const data = await db.getAutos(userID, TABLA_AUTOS);
            return data;
        } catch (error) {
            throw error;
        }
    }




    async function getNegocios(userID) {
        try {
            let negocios = [];
            for (let tabla in TABLA_NEGOCIOS) {
                const negocio = await db.getNegocios(userID, tabla);
                negocio.forEach(n => n.valor = TABLA_NEGOCIOS[tabla]); // Asigna el valor según la tabla
                negocios = negocios.concat(negocio);
            }
            return negocios;
        } catch (error) {
            throw error;
        }
    }

    async function getCasas(userID) {
        try {
            const casas = await db.getCasas(userID, TABLA_CASAS);
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
        getEstadisticas,
        getAutos,
        getNegocios,
        getCasas,
        getMovimientos
    };
};
