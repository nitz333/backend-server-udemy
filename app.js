/*
  Requires (son importaciones de librerías de terceros o personalizadas necesarias)
*/
// En primer lugar debemos cargar la librería de 'express':
var express = require('express');
// Luego (tras haber instalado mongoose al proyecto) cargamos la librería de nuestra base de datos 'mongoose':
var mongoose = require('mongoose');


/*
  Inicialización de variables
*/
// Inicializamos el express. Con esto se define nuestro servidor express:
var app = express();
// Nos conectamos a la base de datos:
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res) => {

    // Si hay algún error, lanzamos el error (recordando que en JavaScript el throw detiene todo)
    if (err) throw err;

    console.log('MongoDB en el puerto 27017: \x1b[32m%s\x1b[0m', 'online');

});


/*
  Rutas
*/
// Establecemos nuestra primera ruta (con tipo de petición get).
// Donde el primer argumento es el path (en este caso la raíz);
// y el segundo argumento es una función callback que recibe 3 parámetros: request, response y next (se usa en middleware
// y le dice a express que cuando se ejecute continúe con la siguiente expresión)
app.get('/', (req, res, next) => {

    // Con express es fácil mandar el código http de la petición para nuestros servicios REST con
    // la función status() pero además quiero que la respuesta sea un JSON.
    // IMPORTANTE: Es una buena práctica estandarizar nuestras respuestas, es decir, el objeto JSON
    //             que vamos a responder, ya que se pretende que la API de nuestro backend responda
    //             de forma similar (mismas key: value) para cualquier petición y código http devuelto.
    res.status(200).json({
        ok: true,
        mensaje: "Petición realizada correctamente"
    });

});


/*
  Escucha de peticiones
*/
// Ponemos a escuchar a nuestro servidor express en el puerto que queramos (en mi caso el 3000):
app.listen(3000, () => {
    console.log('Express server en el puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});