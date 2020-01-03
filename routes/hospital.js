var express = require('express');
// Usaremos el middleware de autenticación por token para ciertas peticiones
var mwAutenticacion = require('../middlewares/autenticacion');

var rutas = express();

// Ya que estas rutas trabajarán con el modelo Hospital, debemos establecerlo para quien quiera crear instancias de éste:
var Hospital = require('../models/hospital');

// =========================================================
// GET: Obtener todos los hospitales
// =========================================================
rutas.get('/', (req, res, next) => {

    // Para la paginación
    // Nota: Siempre que usamos query se trata de un parámetro opcional en la URL
    var desde = req.query.desde || 0;
    desde = Number(desde);

    // Hacemos la búsqueda de todos los documentos (registros) de hospitales en la BD
    // Nota: con populate() llenamos los datos que corresponden al id del usuario que los documentos de
    // de hospitales tienen asociados.  
    Hospital.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre primer_apellido segundo_apellido email')
        .exec(
            (err, docs) => {

                // Si hubo algún error en la base de datos
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: "Error al cargar hospitales.",
                        errors: err
                    });
                }

                // Si todo esta bien

                // Para la paginación en el lado del frontend es útil conocer la cantidad de documentos totales en la colección
                // Usamos la función count() de mongoose
                Hospital.countDocuments({}, (err, conteo) => {

                    res.status(200).json({
                        ok: true,
                        hospitales: docs,
                        total: conteo
                    });

                });

            });
});

// =========================================================
// PUT: Actualizar un hospital (petición PUT o PATCH es prácticamente lo mismo)
// =========================================================
rutas.put('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;
    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    // Nota: por cuestión de gustos todas mis variables las declaro al inicio
    var body = req.body;

    // Buscamos por la existencia del hospital con la función findById de mongoose
    Hospital.findById(id, (err, documento) => {

        // Si hubo algún error en la búsqueda
        // Nota: No es error 400 ya que los métodos find* regresan siempre algo, puede ser null, pero si no entonces es un error 500
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar hospital",
                errors: err
            });
        }

        // Si no existe el documento
        // Nota: Aquí sí es error 400
        if (!documento) {
            return res.status(400).json({
                ok: false,
                mensaje: "El hospital con id " + id + " no existe.",
                errors: { message: "No existe el hospital con ese ID" }
            });
        }

        // Dado que el hospital si existe, por este método es pertinente solo modificar estos datos
        documento.nombre = body.nombre;
        documento.usuario = req.usuarioToken._id; // Añadido a la petición en mwAutenticacion.verificaToken

        // Actualizamos el documento (hospital) en la BD
        documento.save((err, edicionDocumento) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar hospital con id " + id + ".",
                    errors: err
                });
            }

            // Si todo esta bien
            return res.status(200).json({
                ok: true,
                hospital: edicionDocumento
                    //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
            });

        });
    });
});


// =========================================================
// POST: Crear un nuevo hospital
// =========================================================
rutas.post('/', mwAutenticacion.verificaToken, (req, res) => {

    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    var body = req.body;

    // Creamos el hospital enviado en la petición
    var hospital = new Hospital({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuarioToken._id // Añadido a la petición en mwAutenticacion.verificaToken
    });

    // Guardamos el hospital en la BD
    hospital.save((err, nuevoDocumento) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear hospital.",
                errors: err
            });
        }

        // Si todo esta bien
        return res.status(201).json({
            ok: true,
            hospital: nuevoDocumento
                //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });
    });
});

// =========================================================
// DELETE: Eliminar un hospital
// =========================================================
rutas.delete('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;

    // Buscamos por la existencia del hospital con la función findByIdAndDelete de mongoose
    // Nota: También existe la función findByIdAndRemove pero se recomienda usar AndDelete
    Hospital.findByIdAndDelete(id, (err, eliminadoDocumento) => {

        // Si hubo algún error en la eliminación
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al eliminar el hospital",
                errors: err
            });
        }

        // Si no hay un documento (hospital) que eliminar
        if (!eliminadoDocumento) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un hospital con id " + id + ".",
                errors: { message: "No existe un hospital con ese ID" }
            });
        }

        // Si todo esta bien
        return res.status(200).json({
            ok: true,
            hospital: eliminadoDocumento
                //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });
    });
});


module.exports = rutas;