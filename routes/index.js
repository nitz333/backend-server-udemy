/*
 * Archivo de rutas principales
 */

// En primer lugar debemos cargar la librería de 'express':
var express = require('express');

// Inicializamos el express.
var rutas = express();


// Establecemos nuestra primera ruta (con tipo de petición get).
// Donde el primer argumento es el path (en este caso la raíz);
// y el segundo argumento es una función callback que recibe 3 parámetros: request, response y next (se usa en middleware
// y le dice a express que cuando se ejecute continúe con la siguiente expresión)
rutas.get('/', (req, res, next) => {

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

// Finalmente como vamos a usar este archivo afuera, lo exportamos:
module.exports = rutas;