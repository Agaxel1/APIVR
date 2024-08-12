const express = require('express');
const router = express.Router();

// Rutas para cada sección
router.get('/estadisticas', getEstadisticas);
router.get('/autos', getAutos);
router.get('/negocios', getNegocios);
router.get('/casas', getCasas);
router.get('/movimientos', getMovimientos);

// Controladores para las rutas
async function getEstadisticas(req, res) {
    try {
        const estadisticas = await controlador.getEstadisticas(req.userID); // Modifica esto según cómo obtienes los datos
        res.status(200).json(estadisticas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
}

async function getAutos(req, res) {
    try {
        const autos = await controlador.getAutos(req.userID);
        res.status(200).json({ autos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener autos' });
    }
}

async function getNegocios(req, res) {
    try {
        const negocios = await controlador.getNegocios(req.userID);
        res.status(200).json({ negocios });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener negocios' });
    }
}

async function getCasas(req, res) {
    try {
        const casas = await controlador.getCasas(req.userID);
        res.status(200).json({ casas });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener casas' });
    }
}

async function getMovimientos(req, res) {
    try {
        const movimientos = await controlador.getMovimientos(req.userID);
        res.status(200).json({ movimientos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener movimientos' });
    }
}

module.exports = router;
