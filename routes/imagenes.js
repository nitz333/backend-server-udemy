// En primer lugar debemos cargar la librería de 'express':
var express = require('express');

// Inicializamos el express.
var rutas = express();

// Para evitar el engorroso ../../ruta... etc, usaremos el recurso path nativo de node
const path = require('path');
// Usaremos el file system nativo de node para leer rutas en el servidor
var fs = require('fs');



rutas.get('/:tipo/:img', (req, res, next) => {

    var tipo = req.params.tipo;
    var img = req.params.img;

    // Nota: usando el recurso path nativo, podemos hacer uso de __dirname que me da la ruta absoluta del archivo en
    //       donde estoy, el segundo parámetro concatena la ruta donde se encuentra mi imagen.
    //       (Ej: En Windows C:\\mi_ruta\archivo.jpg; En Linux /home/mi_ruta/archivo.jpg)
    var pathImagen = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`);

    // Ahora con ayuda del recurso 'fs', comprobaremos la existencia del archivo
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        var pathNoImagen = path.resolve(__dirname, '../assets/no-img.jpg');
        res.sendFile(pathNoImagen);
    }

});

// Finalmente como vamos a usar este archivo afuera, lo exportamos:
module.exports = rutas;