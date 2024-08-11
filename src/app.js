const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors'); // Importa el paquete cors
const bodyParser = require('body-parser'); // Importa body-parser
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize } = require('sequelize');

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');
const datos = require('./modulos/Datos/rutas');
const logueo = require('./modulos/Logueo/rutas');

const app = express();

// Configuración de Sequelize para almacenar sesiones
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql'
});

// Configuración de la tienda de sesiones
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(session({
    secret: 'tJw84!zP1mA3x9@r3Kq#Lz*98u&5Vc%', // Cambia esto por una cadena secreta segura
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: true } // Cambia a true si estás usando HTTPS
}));

// Sincronizar la base de datos de sesiones
sessionStore.sync();

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
