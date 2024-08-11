const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.post('/login', login);  // Ya lo tienes en POST
router.get('/register', getRegister);

async function login(req, res) {
    const { usuario, password } = req.body;  // Extraes usuario y password del cuerpo de la petición

    try {
        const user = await controlador.Login(usuario, password);  // Llamas a la función Login del controlador
        respuestas.success(req, res, user, 200);  // Devuelves una respuesta exitosa
    } catch (err) {
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);  // Devuelves un error si la autenticación falla
    }
}

async function getRegister(req, res) {
    try {
        const response = await controlador.Register();  // Suponiendo que quieres devolver algún dato para el registro
        respuestas.success(req, res, response, 200);
    } catch (err) {
        respuestas.error(req, res, err, 500);
    }
}

module.exports = router;
