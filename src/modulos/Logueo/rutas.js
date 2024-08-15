const express = require('express');
const respuestas = require('../../red/respuestas');
const controlador = require('./index');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/confirm/:token', confirm);
router.get('/checkAuth', checkAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

const linkconfirm = "http://127.0.0.1:5500/confirmacionExitosa.html"

async function forgotPassword(req, res) {
    const { email } = req.body;

    try {
        const user = await controlador.findUserByEmail(email);

        if (!user) {
            return respuestas.success(req, res, 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.', 200);
        }

        const token = await controlador.generatePasswordResetToken(user.ID);
        const resetLink = `http://127.0.0.1:5500/password.html?token=${token}`;

        // Enviar correo
        const emailBody = `
            <p>Hola ${user.Name},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Puedes hacerlo usando el siguiente enlace:</p>
            <a href="${resetLink}">Restablecer contraseña</a>
            <p>Si no solicitaste este cambio, simplemente ignora este correo.</p>
        `;
        await controlador.sendMail(email, emailBody);

        respuestas.success(req, res, 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.', 200);
    } catch (err) {
        console.error('Error en forgotPassword:', err.message); // Agrega un log para el error
        respuestas.error(req, res, 'Hubo un error al procesar la solicitud.', 500);
    }
}

async function resetPassword(req, res) {
    const { resetToken, newPassword } = req.body; // Cambiar de token a resetToken

    try {
        await controlador.resetUserPassword(resetToken, newPassword); // Usar resetToken
        respuestas.success(req, res, 'Contraseña restablecida correctamente.', 200);
    } catch (err) {
        respuestas.error(req, res, 'El token es inválido o ha expirado.', 200);
    }
}

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

        respuestas.success(req, res, { message: 'Login exitoso', token, userID: user.ID, username: user.Name }, 200);
    } catch (err) {
        console.error('Login error:', err);
        respuestas.error(req, res, 'Usuario o contraseña incorrectos', 401);
    }
}




async function checkAuth(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return respuestas.success(req, res, { authenticated: false }, 200);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return respuestas.success(req, res, { authenticated: false }, 200);
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        respuestas.success(req, res, { authenticated: true, user: decoded }, 200);
    } catch (err) {
        console.error('Token verification error:', err);
        respuestas.success(req, res, { authenticated: false }, 200);
    }
}

async function register(req, res) {
    const { username, email, password, passwordConfirm, sexo, nacionalidad, raza } = req.body;

    if (password !== passwordConfirm) {
        return respuestas.error(req, res, 'Las contraseñas no coinciden', 400);
    }

    try {
        await controlador.registerUser(username, email, password, sexo, nacionalidad, raza);
        respuestas.success(req, res, 'Registro exitoso. Por favor, revisa tu correo para confirmar tu registro.', 200);
    } catch (err) {
        respuestas.error(req, res, err.message || 'Error al registrar usuario', 200);
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
