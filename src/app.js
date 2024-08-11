const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');
const datos = require('./modulos/Datos/rutas');
const logueo = require('./modulos/Logueo/rutas');

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

app.use(session({
    secret: config.session.secret, // Tu secreto de sesión
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Cambia a true si estás usando HTTPS
        sameSite: 'Lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://127.0.0.1:5500',
            'https://api.vida-roleplay.com'
        ];
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('No se puede'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

app.set('port', config.app.port);

app.use('/api/posts', posts);
app.use('/api/anuncios', anuncios);
app.use('/api/datos', datos);
app.use('/api/logueo', logueo);

module.exports = app;
