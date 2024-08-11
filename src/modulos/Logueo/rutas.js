const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const crypto = require('crypto');

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
        respuestas.success(req, res, user, 200);
    } catch (err) {
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
    }
}

async function checkAuth(req, res) {
    console.log('Estado de sesión:', req.session); // Depuración
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
}

async function logout(req, res) {
    try {
        await controlador.Logout(req);
        respuestas.success(req, res, 'Sesión cerrada exitosamente', 200);
    } catch (err) {
        respuestas.error(req, res, 'Error al cerrar sesión', 500);
    }
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
