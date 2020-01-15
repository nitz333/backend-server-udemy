// =========================================================
// Requires (son importaciones de librerías de terceros o personalizadas necesarias)
// =========================================================
// En primer lugar debemos cargar la librería de 'express':
var express = require('express');
// Luego (tras haber instalado mongoose al proyecto) cargamos la librería de nuestra base de datos 'mongoose':
var mongoose = require('mongoose');
// Usaremos la librería 'Body Parser' para peticiones tipo POST
var bodyParser = require('body-parser');


// =========================================================
// Inicialización de variables
// =========================================================
// Con esto se configura e inicializa el servidor express:
var app = express();

// CORS (permitir peticiones desde otros dominios, configuración light: https://enable-cors.org/server_expressjs.html)
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from (* para cualquiera)
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
});

// Configuramos la librería 'Body Parser' (https://www.npmjs.com/package/body-parser)
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json


// Importación de rutas
var indexRoutes = require('./routes/index');
var usuarioRoutes = require('./routes/usuario');
var loginRoutes = require('./routes/login');
var hospitalRoutes = require('./routes/hospital');
var medicoRoutes = require('./routes/medico');
var busquedaRoutes = require('./routes/busqueda');
var uploadRoutes = require('./routes/upload');
var imagenesRoutes = require('./routes/imagenes');

// Nos conectamos a la base de datos:
// IMPORTANTE: A diferencia del video, la conexión la estableceré de la siguiente forma ya que a la fecha
//             MongoDB ha realizado cambios y el código del video me daba los warnings:
//             (node:3228) DeprecationWarning: current URL string... pass option { useNewUrlParser: true } to MongoClient.connect.
//             (node:11168) DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.
//             (node:3228) DeprecationWarning: current Server Dis... pass option { useUnifiedTopology: true } to the MongoClient constructor.
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB en el puerto 27017: \x1b[32m%s\x1b[0m', 'online');
}).catch(err => {
    // Si hay algún error, lanzamos el error (recordando que en JavaScript el throw detiene todo)
    console.error(err);
});


// =========================================================
// Rutas
// =========================================================
// [Se modularizó esta parte para no llenar de rutas este archivo]
// NOTA: Las rutas serán a través de middlewares (es algo que se ejecuta antes de que se resuelvan otras rutas);
//       Las rutas deben ser ordenadas de más particulares a más generales (la raíz es la más general)
app.use('/medico', medicoRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/login', loginRoutes);
app.use('/busqueda', busquedaRoutes);
app.use('/upload', uploadRoutes);
app.use('/img', imagenesRoutes);
app.use('/', indexRoutes);


// =========================================================
// Escucha de peticiones
// =========================================================
// Ponemos a escuchar a nuestro servidor express en el puerto que queramos (en mi caso el 3000):
app.listen(3000, () => {
    console.log('Express server en el puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});