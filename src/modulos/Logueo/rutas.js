const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/confirm/:token', confirm);
router.get('/checkAuth', checkAuth);

const linkconfirm = "http://127.0.0.1:5500/confirmacionExitosa.html"

async function login(req, res) {
    const { usuario, password } = req.body;

    try {
        const user = await controlador.Login(req, usuario, password);

        if (!user) {
            return respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
        }

        // Determina el tiempo de expiración según la opción "Recordar este dispositivo"
        const rememberMe = req.body.remember || false;
        const tokenExpiry = rememberMe ? '7d' : '15m'; // Cambia '15m' a '15d' para 15 días

        const token = jwt.sign({ userID: user.ID, username: user.Name }, config.jwt.secret, { expiresIn: tokenExpiry });
        console.log('Generated token:', token);

        respuestas.success(req, res, { message: 'Login exitoso', token, userID: user.ID }, 200);
    } catch (err) {
        console.error('Login error:', err);
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
    }
}




async function checkAuth(req, res) {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    if (!authHeader) {
        console.log('No auth header provided');
        return respuestas.success(req, res, { authenticated: false }, 200);
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token);

    if (!token) {
        console.log('Token is undefined');
        return respuestas.success(req, res, { authenticated: false }, 200);
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        console.log('Decoded token:', decoded);
        respuestas.success(req, res, { authenticated: true, user: decoded }, 200);
    } catch (err) {
        console.error('Token verification error:', err);
        respuestas.success(req, res, { authenticated: false }, 200);
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
        await controlador.confirmRegistration(token);
        res.redirect(`${linkconfirm}`);  // Redirige a un sitio web externo
    } catch (err) {
        respuestas.error(req, res, err.message || 'Error al confirmar registro', 500);
    }
}


module.exports = router;
