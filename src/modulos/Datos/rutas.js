const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const { encryptData } = require('../../app'); // Importar la función de encriptación

const router = express.Router();

router.get('/', getEmisoras);
router.get('/get-trabajos', getTrabajos);


async function getEmisoras(req, res) {
    const tipo = req.query.Tipo || "E";
    try {
        const { emisoras } = await controlador.Emisoras(tipo);
        const response = {
            content: emisoras,
        };

        // Cifrar la respuesta
        const encryptedResponse = encryptData(response);

        respuestas.success(req, res, { data: encryptedResponse }, 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

async function getTrabajos(req, res) {
    const tipo = req.query.Tipo || "TI";
    const tipo2 = req.query.Tipo2 || "TL";
    try {
        const { trabajos } = await controlador.Trabajos(tipo, tipo2);
        const response = {
            content: trabajos,
        };

        // Cifrar la respuesta
        const encryptedResponse = encryptData(response);

        respuestas.success(req, res, { data: encryptedResponse }, 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}


module.exports = router;
