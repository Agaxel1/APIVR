const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors'); // Importa el paquete cors

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors()); // Usa el middleware cors

// Configuración
app.set('port', config.app.port);

// Rutas
app.use('/api/posts', posts);
app.use('/api/anuncios', anuncios);

module.exports = app;
