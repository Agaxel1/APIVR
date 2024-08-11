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

app.use(session({
    secret: 'tJw84!zP1mA3x9@r3Kq#Lz*98u&5Vc%',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Cambia a true si usas HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas, ajusta según sea necesario
    }
}));

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://127.0.0.1:5500', 
            'https://api.vida-roleplay.com'
        ];
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
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
