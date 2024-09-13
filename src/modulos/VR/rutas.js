const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

// Rutas para cada sección
router.get('/estadisticas', getEstadisticas);
router.get('/autos', getAutos);
router.get('/negocios', getNegocios);
router.get('/casas', getCasas);
router.get('/movimientos', getMovimientos);
router.get('/tops', getTops);
router.get('/certification-status', getCertificationStatus);
router.get('/links', getLinks);
router.post('/certify', certifyUser);
router.get('/server-status', statusServer);
router.post('/change-password', changePassword);
router.get('/Questions', Questions);
router.get('/historias', Historias);
router.post('/save-historia', saveHistoria);
router.get('/historias/:id', getHistoriaDetalles);
router.post('/save-historia-user', decidirHistoria);

// Obtener detalles de una historia
async function getHistoriaDetalles(req, res) {
    const { id } = req.params;
    try {
        const historia = await controlador.getHistoriaDetalles(id);
        respuestas.success(req, res, historia, 200);
    } catch (error) {
        console.error('Error al obtener detalles de la historia:', error);
        respuestas.error(req, res, 'Error al obtener detalles de la historia', 500);
    }
}

// Aprobar o rechazar una historia
async function decidirHistoria(req, res) {
    const { historiaID, decision } = req.body;
    try {
        if (!decision || (decision !== 'aprobar' && decision !== 'rechazar')) {
            return respuestas.error(req, res, 'Decisión no válida.', 400);
        }

        const result = await controlador.decisionHistoria(historiaID, decision);
        respuestas.success(req, res, result, 200);
    } catch (err) {
        console.error('Error al procesar la decisión de la historia:', err);
        respuestas.error(req, res, 'Error al procesar la decisión de la historia.', 500);
    }
}


async function Historias(req, res) {

    try {
        const historias = await controlador.getHistorias();
        respuestas.success(req, res, historias, 200);
    } catch (error) {
        console.error('Error al obtener historias:', error);
        respuestas.error(req, res, 'Error al obtener historias', 500);
    }
}

async function saveHistoria(req, res) {
    const { userID, historia } = req.body;
    try {
        // Verificar que todos los campos estén presentes
        if (!userID || !historia) {
            return respuestas.error(req, res, 'Todos los campos son requeridos.', 400);
        }

        const result = await controlador.saveHistory(userID, historia);
        respuestas.success(req, res, result, 200); // Enviar el mensaje del controlador
    } catch (err) {
        console.error("Error al actualizar la historia:", err); // Agregar más información sobre el error
        respuestas.error(req, res, 'Error al actualizar la historia.', 400); // Cambiado el código de error a 500
    }
}


async function Questions(req, res) {
    const { type } = req.query;

    try {
        const questions = await controlador.getQuestions(type);
        respuestas.success(req, res, questions, 200);
    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        respuestas.error(req, res, 'Error al obtener preguntas', 500);
    }
}


async function changePassword(req, res) {
    const { userID, currentPassword, newPassword } = req.body;

    try {
        // Verificar que todos los campos estén presentes
        if (!userID || !currentPassword || !newPassword) {
            return respuestas.error(req, res, 'Todos los campos son requeridos.', 400);
        }

        await controlador.changeUserPassword(userID, currentPassword, newPassword);
        respuestas.success(req, res, 'Contraseña actualizada correctamente.', 200);
    } catch (err) {
        console.error("Error al cambiar la contraseña en el servidor:", err); // Agregar más información sobre el error
        respuestas.error(req, res, 'Error al cambiar la contraseña.', 400);
    }
}



async function statusServer(req, res) {
    try {
        const status = await controlador.getServerStatus(); // Llama a la función del controlador que obtiene el estado del servidor
        respuestas.success(req, res, status, 200);
    } catch (error) {
        respuestas.error(req, res, error, 200);
    }
}


async function certifyUser(req, res) {
    const { userID, Tipo } = req.body;  // Obtén el userID desde el cuerpo de la solicitud
    try {
        const result = await controlador.certifyUser(userID, Tipo);
        respuestas.success(req, res, result, 200);
    } catch (error) {
        console.error('Error al actualizar el estado de certificación:', error);
        respuestas.error(req, res, 'Error al actualizar el estado de certificación', 500);
    }
}


async function getLinks(req, res) {
    try {
        const links = await controlador.getLinks();
        respuestas.success(req, res, links, 200);
    } catch (error) {
        console.error('Error al obtener los enlaces:', error);
        respuestas.error(req, res, 'Error al obtener los enlaces', 500);
    }
}

// Nueva función para obtener el estado de certificación
async function getCertificationStatus(req, res) {
    const userID = req.query.userID;
    try {
        const status = await controlador.getCertificationStatus(userID);
        respuestas.success(req, res, status, 200);
    } catch (error) {
        console.error('Error al obtener el estado de certificación:', error);
        respuestas.error(req, res, 'Error al obtener el estado de certificación', 500);
    }
}


// Nueva función para obtener los TOPS
async function getTops(req, res) {
    try {
        const tops = await controlador.getTops();
        respuestas.success(req, res, tops, 200);
    } catch (error) {
        console.error('Error al obtener TOPS:', error);
        respuestas.error(req, res, 'Error al obtener TOPS', 500);
    }
}

// Controladores para las rutas
async function getEstadisticas(req, res) {
    const userID = req.query.userID; // Asegúrate de que estás obteniendo el userID de la manera correcta
    const Name = req.query.Name;
    try {
        const estadisticas = await controlador.getEstadisticas(userID, Name);
        respuestas.success(req, res, estadisticas, 200);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        respuestas.error(req, res, 'Error al obtener estadísticas', 500);
    }
}

async function getAutos(req, res) {
    const userID = req.query.userID; // Asegúrate de que estás obteniendo el userID de la manera correcta
    try {
        const data = await controlador.getAutos(userID);
        respuestas.success(req, res, data, 200);
    } catch (error) {
        console.error('Error al obtener autos:', error);
        respuestas.error(req, res, 'Error al obtener autos', 500);
    }
}



async function getNegocios(req, res) {
    const userID = req.query.userID; // Asegúrate de que estás obteniendo el userID de la manera correcta
    try {
        const negocios = await controlador.getNegocios(userID);
        respuestas.success(req, res, negocios, 200);
    } catch (error) {
        console.error('Error al obtener negocios:', error);
        respuestas.error(req, res, 'Error al obtener negocios', 500);
    }
}

async function getCasas(req, res) {
    const userID = req.query.userID; // Asegúrate de que estás obteniendo el userID de la manera correcta
    try {
        const casas = await controlador.getCasas(userID);
        respuestas.success(req, res, casas, 200);
    } catch (error) {
        console.error('Error al obtener casas:', error);
        respuestas.error(req, res, 'Error al obtener casas', 500);
    }
}

async function getMovimientos(req, res) {
    const userID = req.query.userID; // Asegúrate de que estás obteniendo el userID de la manera correcta
    try {
        const movimientos = await controlador.getMovimientos(userID);
        respuestas.success(req, res, movimientos, 200);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        respuestas.error(req, res, 'Error al obtener movimientos', 500);
    }
}

module.exports = router;
