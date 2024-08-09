const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.get('/login', getLogin);
router.get('/register', getRegister);

async function getLogin(req, res) {
    const usuario = req.query.usuario;
    const password = req.query.password;
    try {
        const { login} = await controlador.Login(usuario, password);
        const response = {
            content: login,
        };
        respuestas.success(req, res, response, 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

async function getRegister(req, res) {
    const tipo = req.query.Tipo || "TI";
    const tipo2 = req.query.Tipo2 || "TL";
    try {
        const { trabajos} = await controlador.Trabajos(tipo, tipo2);
        const response = {
            content: trabajos,
        };
        respuestas.success(req, res, response, 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

module.exports = router;
