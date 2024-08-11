const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Añadido para JWT
const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');
const datos = require('./modulos/Datos/rutas');
const logueo = require('./modulos/Logueo/rutas');

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

const corsOptions = {
    origin: '*',
    /*origin: function (origin, callback) {
        const allowedOrigins = [
            'http://127.0.0.1:5500',
            'https://api.vida-roleplay.com'
        ];
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('No se puede'));
        }
    }*/
};

app.use(cors(corsOptions));

app.set('port', config.app.port);

// Middleware para verificar el token en rutas protegidas
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    console.log('Token recibido:', token);  // Verifica el token recibido

    if (!token) {
        console.log('No se recibió token.');
        return res.sendStatus(403);
    }

    jwt.verify(token, 'tu_secreto', (err, user) => {
        if (err) {
            console.log('Error verificando token:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Aplica la autenticación JWT a rutas protegidas
app.use('/api/posts', authenticateToken, posts);
app.use('/api/anuncios', authenticateToken, anuncios);
app.use('/api/datos', authenticateToken, datos);

// La ruta de logueo genera el token JWT
app.use('/api/logueo', logueo);

module.exports = app;
