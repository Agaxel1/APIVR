const TABLA_ESTADISTICAS = 'PlayaRP';
const TABLA_HISTORIA = 'HistoriaPendiente';
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


    async function changeUserName(userID, newCharacterName) {
        try {
            const resetInfo = await db.updateUserChangeName(TABLA_ESTADISTICAS, userID, newCharacterName);
            return resetInfo;
        } catch (error) {
            throw error;
        }
    }

    async function getHistoriaDetalles(id) {
        try {
            const historia = await db.getHistoriaDetalles(TABLA_HISTORIA, id);
            return historia;
        } catch (error) {
            throw error;
        }
    }

    async function decisionHistoria(id, decision) {
        try {
            const result = await db.decisionHistoria(TABLA_ESTADISTICAS, TABLA_HISTORIA, id, decision);
            return result;
        } catch (error) {
            throw error;
        }
    }


    async function getHistorias() {
        try {
            // Llama a la función correspondiente en mysql.js
            const historias = await db.getHistorias(TABLA_HISTORIA);
            return historias;
        } catch (error) {
            throw error;
        }
    }

    async function saveHistory(userID, historia) {
        try {
            const result = await db.SendHistoryAprove(TABLA_HISTORIA, userID, historia);
            return result; // Retorna el mensaje de la base de datos
        } catch (error) {
            throw error;
        }
    }


    async function getQuestions(type) {
        try {
            // Llama a la función correspondiente en mysql.js
            const questions = await db.getQuestions(type);
            return questions;
        } catch (error) {
            throw error;
        }
    }

    async function changeUserPassword(userID, currentPassword, newPassword) {
        try {
            const resetInfo = await db.updateUserChangePassword(TABLA_ESTADISTICAS, userID, currentPassword, newPassword);
            return resetInfo;
        } catch (error) {
            throw error;
        }
    }

    // Nueva función para obtener el estado del servidor desde mysql.js
    async function getServerStatus() {
        try {
            const status = await db.getServerStatusmysql(); // Llama a la función en mysql.js
            return status;
        } catch (error) {
            throw error;
        }
    }

    async function getTops() {
        try {
            const columnasTops = {
                PuntosDeRol: 'TOP puntos de rol',
                Bank: 'TOP dinero',
                HorasJugadas: 'TOP horas jugadas',
                DineroGastado: 'TOP dinero gastado'
            };

            let tops = [];
            for (let [columna, titulo] of Object.entries(columnasTops)) {
                const datosTop = await db.getTops(columna);
                tops.push({
                    id: columna,
                    title: titulo,
                    headers: datosTop.headers,
                    rows: datosTop.rows
                });
            }

            return tops;
        } catch (error) {
            throw error;
        }
    }


    // Funciones de controladores
    async function getEstadisticas(userID, Name) {
        try {
            const estadisticas = await db.getEstadisticas(userID, Name, TABLA_ESTADISTICAS);
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

    async function certifyUser(userID, Tipo) {
        try {
            const result = await db.updateCertificationStatus(userID, Tipo);
            return result;
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

    async function getCertificationStatus(userID) {
        try {
            const certificationStatus = await db.getCertificationStatus(userID);
            return certificationStatus;
        } catch (error) {
            throw error;
        }
    }

    async function getLinks() {
        try {
            const links = await db.getLinks();
            return links;
        } catch (error) {
            throw error;
        }
    }

    return {
        changeUserName,
        decisionHistoria,
        getHistoriaDetalles,
        getHistorias,
        saveHistory,
        getQuestions,
        changeUserPassword,
        getServerStatus,
        certifyUser,
        getTops,
        getEstadisticas,
        getAutos,
        getNegocios,
        getCasas,
        getMovimientos,
        getCertificationStatus,
        getLinks
    };
};
