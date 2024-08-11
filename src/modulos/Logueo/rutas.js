const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const router = express.Router();

router.post('/login', login);
router.get('/checkAuth', checkAuth);

async function login(req, res) {
    const { usuario, password } = req.body;

    try {
        const user = await controlador.Login(req, usuario, password);
        // Generar el token JWT
        const token = jwt.sign({ userID: user.ID, username: user.Name }, config.jwt.secret, { expiresIn: '1d' });
        console.log('Generated token:', token);

        respuestas.success(req, res, { message: 'Login exitoso', token }, 200);
    } catch (err) {
        console.error('Login error:', err);
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
    }
}

async function checkAuth(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No auth header');
        return respuestas.success(req, res, { authenticated: false }, 200);
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token);

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        console.log('Decoded token:', decoded);
        respuestas.success(req, res, { authenticated: true, user: decoded }, 200);
    } catch (err) {
        console.error('Token verification error:', err);
        respuestas.success(req, res, { authenticated: false }, 200);
    }
}

module.exports = router;
