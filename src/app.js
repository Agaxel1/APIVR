const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors'); // Importa el paquete cors
const bodyParser = require('body-parser'); // Importa body-parser

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');
const datos = require('./modulos/Datos/rutas');
const logueo = require('./modulos/Logueo/rutas');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cors()); // Usa el middleware cors

// Configuración
app.set('port', config.app.port);

// Rutas
app.use('/api/posts', posts);
app.use('/api/anuncios', anuncios);
app.use('/api/datos', datos);
app.use('/api/logueo', logueo);

module.exports = app;
