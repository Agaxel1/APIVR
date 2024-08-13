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



async function certifyUser(req, res) {
    const { userID, Tipo } = req.body;  // Obtén el userID desde el cuerpo de la solicitud
    try {
        const result = await controlador.certifyUserC(userID, Tipo);
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
