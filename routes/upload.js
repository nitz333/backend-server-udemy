// En primer lugar debemos cargar la librería de 'express':
var express = require('express');

// Usaremos la librería express-fileupload para trabajar con archivos
var fileUpload = require('express-fileupload');

// Usaremos el file system nativo de node para leer rutas en el servidor
var fs = require('fs');

// Inicializamos el express.
var rutas = express();

// Vamos a ocupar las colecciones
var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// El siguiente middleware es necesario por express-fileupload
// default options
rutas.use(fileUpload());

// Nota: En este caso preferimos PUT ya que en teoría solo estaremos subiendo archivos asociados a datos
//       que ya existen en la base de datos, pero bien se pudo haber usado POST.
rutas.put('/:tipo/:id', (req, res, next) => {

    // Usaremos este par de parámetros para asociar la imagen a un tipo o colección...
    var tipo = req.params.tipo;
    // ... y para asignar el nombre personalizado de archivo con el id del usuario
    var id = req.params.id;

    // Validamos que el tipo de colección sea válido
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];

    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: "Tipo de colección no es válida",
            errors: { message: "Tipo de colección no es válida" }
        });
    }

    // Verificamos que vengan archivos en el request
    // Nota: en el video no viene pero la actualización de la librería express-fileupload sugiere
    //       que también se verifique en Object.keys
    if (!req.files || Object.keys(req.files).length === 0) {

        return res.status(400).json({
            ok: false,
            mensaje: "No selecciono algún archivo",
            errors: { message: "Debe seleccionar un archivo de imagen" }
        });

    }

    // Validemos que se trate de un archivo de imagen

    var archivo = req.files.imagen; // imagen es el nombre del input en el form
    // Obtengo el nombre del archivo en forma de array (separado por puntos '.' por si el nombre de la imagen contiene más de uno)
    var nombreSplit = archivo.name.split('.');
    // Nos quedamos con el último elemento del nombreSplit que será la extensión
    var extension = nombreSplit[nombreSplit.length - 1];

    // Solo aceptaremos las siguientes extensiones
    var extensionesValidas = ['jpg', 'jpeg', 'png', 'gif'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: "Extensión no válida",
            errors: { message: "Las extensiones válidas son: " + extensionesValidas.join(', ') }
        });
    }

    // Crearemos un nombre personalizado para la imagen, optamos por formarlo de acuerdo al id del
    // usuario (garantiza que no sobreescribirá al de otro usuario) seguido de un número 'aleatorio'
    // (garantiza que no entre en conflicto con la caché del navegador)
    var nombreFinal = `${ id }-${ new Date().getMilliseconds() }.${ extension }`;

    // Movemos el archivo del directorio temp a un path
    var path = `./uploads/${ tipo }/${ nombreFinal }`;
    archivo.mv(path, err => {

        if (err) {
            res.status(500).json({
                ok: false,
                mensaje: "Error al mover archivo",
                errors: err
            });
        }

        // Asignamos el nombre final del archivo al documento identificado por su colección e id.
        // Nota: Dado que vamos a llamar una función, dejaremos que ésta sea quien regrese la respuesta,
        //       por eso mandamos también el 'res'
        subirPorTipo(tipo, id, nombreFinal, res);

        // res.status(200).json({
        //     ok: true,
        //     mensaje: "Archivo recibido correctamente"
        // });

    });

});

function subirPorTipo(coleccion, _id, nombreArchivo, response) {
    if (coleccion === 'usuarios') {
        // Buscamos que el usuario exista
        Usuario.findById(_id, (err, documento) => {

            if (!documento) {
                return response.status(400).json({
                    ok: false,
                    mensaje: "No existe el usuario",
                    errors: { message: "No existe el usuario" }
                });
            }

            // Necesitamos la imagen vieja (almacenado en el documento) si es que ya se tenía
            var pathViejo = './uploads/usuarios/' + documento.img;

            // Si existe la imagen, debemos eliminarla "físicamente". Para eso se importo el recurso filesystem nativo 'fs'
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo, err => {

                    if (err) {
                        return response.status(500).json({
                            ok: false,
                            mensaje: "Error al reemplazar imagen",
                            errors: err
                        });
                    }

                });
            }

            documento.img = nombreArchivo;

            documento.save((err, edicionDocumento) => {

                // ¡PERO ANTES! Solo de manera visual mandamos un emoticon en vez de nuestra contraseña encriptada.
                edicionDocumento.password = ';P';

                return response.status(200).json({
                    ok: true,
                    mensaje: "Imagen actualizada",
                    usuario: edicionDocumento
                });

            });
        });
    }
    if (coleccion === 'medicos') {
        // Buscamos que el medico exista
        Medico.findById(_id, (err, documento) => {

            if (!documento) {
                return response.status(400).json({
                    ok: false,
                    mensaje: "No existe el médico",
                    errors: { message: "No existe el médico" }
                });
            }

            // Necesitamos la imagen vieja (almacenado en el documento) si es que ya se tenía
            var pathViejo = './uploads/medicos/' + documento.img;

            // Si existe la imagen, debemos eliminarla "físicamente". Para eso se importo el recurso filesystem nativo 'fs'
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo, err => {

                    if (err) {
                        return response.status(500).json({
                            ok: false,
                            mensaje: "Error al reemplazar imagen",
                            errors: err
                        });
                    }

                });
            }

            documento.img = nombreArchivo;

            documento.save((err, edicionDocumento) => {

                return response.status(200).json({
                    ok: true,
                    mensaje: "Imagen actualizada",
                    medico: edicionDocumento
                });

            });
        });
    }
    if (coleccion === 'hospitales') {
        // Buscamos que el hospital exista
        Hospital.findById(_id, (err, documento) => {

            if (!documento) {
                return response.status(400).json({
                    ok: false,
                    mensaje: "No existe el hospital",
                    errors: { message: "No existe el hospital" }
                });
            }

            // Necesitamos la imagen vieja (almacenado en el documento) si es que ya se tenía
            var pathViejo = './uploads/hospitales/' + documento.img;

            // Si existe la imagen, debemos eliminarla "físicamente". Para eso se importo el recurso filesystem nativo 'fs'
            if (fs.existsSync(pathViejo)) {
                fs.unlink(pathViejo, err => {

                    if (err) {
                        return response.status(500).json({
                            ok: false,
                            mensaje: "Error al reemplazar imagen",
                            errors: err
                        });
                    }

                });
            }

            documento.img = nombreArchivo;

            documento.save((err, edicionDocumento) => {

                return response.status(200).json({
                    ok: true,
                    mensaje: "Imagen actualizada",
                    hospital: edicionDocumento
                });

            });
        });
    }
}

// Finalmente como vamos a usar este archivo afuera, lo exportamos:
module.exports = rutas;