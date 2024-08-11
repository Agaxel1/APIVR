const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize } = require('sequelize');

const posts = require('./modulos/posts/rutas');
const anuncios = require('./modulos/anuncios/rutas');
const datos = require('./modulos/Datos/rutas');
const logueo = require('./modulos/Logueo/rutas');

const app = express();

const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql'
});

const sessionStore = new SequelizeStore({ db: sequelize });

app.use(session({
    secret: 'tJw84!zP1mA3x9@r3Kq#Lz*98u&5Vc%',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { 
        secure: false, // Cambia a true si usas HTTPS
        //maxAge: 24 * 60 * 60 * 1000 // 24 horas
        maxAge: 10 * 1000
    }
}));

sessionStore.sync();

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

app.set('port', config.app.port);

app.use('/api/posts', posts);
app.use('/api/anuncios', anuncios);
app.use('/api/datos', datos);
app.use('/api/logueo', logueo);

module.exports = app;
