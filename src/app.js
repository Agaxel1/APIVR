const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors'); // Importa el paquete cors
const bodyParser = require('body-parser'); // Importa body-parser

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' })); // Aumenta el límite a 50MB
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Aumenta el límite para datos de formularios
app.use(cors()); // Usa el middleware cors

// Configuración
app.set('port', config.app.port);

// Rutas
app.use('/api/posts', posts);
app.use('/api/anuncios', anuncios);

module.exports = app;
