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
router.post('/change-password', changePassword);

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
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #1e1e1e; color: #e0e0e0;">
        <div style="max-width: 600px; margin: 40px auto; background: #2b2b2b; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); text-align: center;">
            <img src="https://i.postimg.cc/k5rg5Z7X/logo.png" alt="Vida Roleplay" style="max-width: 150px; margin-bottom: 20px;">
            <h1 style="color: #ffffff;">Hola ${user.Name},</h1>
            <p style="color: #c0c0c0; line-height: 1.5;">Recibimos una solicitud para restablecer tu contraseña. Puedes hacerlo usando el siguiente enlace:</p>
            <a href="${resetLink}" style="display: inline-flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 10px; padding: 14px 28px; font-size: 20px; font-weight: bold; background-color: #0069d9; color: #ffffff; text-decoration: none; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); transition: background-color 0.2s ease-in-out;">Restablecer Contraseña</a>
            <p style="color: #c0c0c0;">Si no solicitaste este cambio, simplemente ignora este correo.</p>
            <div style="font-size: 12px; color: #888888; margin-top: 20px;">
                <p>&copy; 2024 Vida Roleplay. Todos los derechos reservados.</p>
                <p><img src="https://i.postimg.cc/XJ1cf1CB/email.png" alt="Email Icon" style="width: 24px; vertical-align: middle; margin-right: 8px;"> Si tienes problemas, contacta con soporte.</p>
            </div>
        </div>
    </body>
    </html>
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
        respuestas.error(req, res, 'El token es inválido o ha expirado.', 400);
    }
}

async function changePassword(req, res) {
    const { userID, currentPassword, newPassword } = req.body; // Cambiar de token a resetToken

    try {
        await controlador.changeUserPassword(userID, currentPassword, newPassword); // Usar resetToken
        respuestas.success(req, res, 'Contraseña restablecida correctamente.', 200);
    } catch (err) {
        respuestas.error(req, res, 'El token es inválido o ha expirado.', 400);
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
