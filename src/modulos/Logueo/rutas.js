const jwt = require('jsonwebtoken');
const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const crypto = require('crypto');
const config = require('../../config');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/confirm/:token', confirm);
router.get('/checkAuth', checkAuth);

async function login(req, res) {
    const { usuario, password } = req.body;

    try {
        const user = await controlador.Login(req, usuario, password);
        const token = jwt.sign({ id: user.ID }, config.jwt.secret, { expiresIn: '1h' });
        respuestas.success(req, res, { success: true, token }, 200);
    } catch (err) {
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
    }
}

async function checkAuth(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return respuestas.error(req, res, 'No autenticado', 401);
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        respuestas.success(req, res, { authenticated: true, userId: decoded.id }, 200);
    } catch (err) {
        respuestas.error(req, res, 'Token inválido o expirado', 401);
    }
}

async function logout(req, res) {
    respuestas.success(req, res, 'Sesión cerrada exitosamente', 200);
}

async function register(req, res) {
    const { username, email, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
        return respuestas.error(req, res, 'Las contraseñas no coinciden', 400);
    }

    try {
        const token = crypto.randomBytes(32).toString('hex');
        await controlador.registerUser(username, email, password, token);
        respuestas.success(req, res, 'Registro exitoso. Por favor, revisa tu correo para confirmar tu registro.', 200);
    } catch (err) {
        respuestas.error(req, res, err.message || 'Error al registrar usuario', 500);
    }
}

async function confirm(req, res) {
    const token = req.params.token;
    try {
        await controlador.confirmUser(token);
        respuestas.success(req, res, 'Registro confirmado exitosamente', 200);
    } catch (err) {
        respuestas.error(req, res, err.message || 'Error al confirmar registro', 500);
    }
}

module.exports = router;
