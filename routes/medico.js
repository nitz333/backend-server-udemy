var express = require('express');
// Usaremos el middleware de autenticación por token para ciertas peticiones
var mwAutenticacion = require('../middlewares/autenticacion');

var rutas = express();

// Ya que estas rutas trabajarán con el modelo Medico, debemos establecerlo para quien quiera crear instancias de éste:
var Medico = require('../models/medico');

// =========================================================
// GET: Obtener todos los médicos
// =========================================================
rutas.get('/', (req, res, next) => {

    // Para la paginación
    // Nota: Siempre que usamos query se trata de un parámetro opcional en la URL
    var desde = req.query.desde || 0;
    desde = Number(desde);

    // Hacemos la búsqueda de todos los documentos (registros) de medicos en la BD
    // Nota: con populate() llenamos los datos que corresponden al id del usuario e id del hospital
    //       que los documentos de medicos tienen asociados. 
    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre primer_apellido segundo_apellido email')
        .populate('hospital')
        .exec(
            (err, docs) => {

                // Si hubo algún error en la base de datos
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: "Error al cargar medicos.",
                        errors: err
                    });
                }

                // Si todo esta bien

                // Para la paginación en el lado del frontend es útil conocer la cantidad de documentos totales en la colección
                // Usamos la función count() de mongoose

                Medico.countDocuments({}, (err, conteo) => {

                    res.status(200).json({
                        ok: true,
                        medicos: docs,
                        total: conteo
                    });

                });

            });
});

// =========================================================
// PUT: Actualizar un médico (petición PUT o PATCH es prácticamente lo mismo)
// =========================================================
rutas.put('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;
    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    // Nota: por cuestión de gustos todas mis variables las declaro al inicio
    var body = req.body;

    //body.usuario = req.usuarioToken._id; // Añadido a la petición en mwAutenticacion.verificaToken

    // Buscamos por la existencia del médico con la función findById de mongoose
    Medico.findById(id, (err, documento) => {

        // Si hubo algún error en la búsqueda
        // Nota: No es error 400 ya que los métodos find* regresan siempre algo, puede ser null, pero si no entonces es un error 500
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar médico",
                errors: err
            });
        }

        // Si no existe el documento
        // Nota: Aquí sí es error 400
        if (!documento) {
            return res.status(400).json({
                ok: false,
                mensaje: "El médico con id " + id + " no existe.",
                errors: { message: "No existe un médico con ese ID" }
            });
        }

        // Dado que el médico si existe, por este método es pertinente solo modificar estos datos
        documento.nombre = body.nombre;
        documento.usuario = req.usuarioToken._id; // Añadido a la petición en mwAutenticacion.verificaToken
        documento.hospital = body.hospital; // Nota: Se recibirá el id del hospital desde el frontend (problablemente desde algún input de form)

        // Actualizamos el documento (medico) en la BD
        documento.save((err, edicionDocumento) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar médico con id " + id + ".",
                    errors: err
                });
            }

            // Si todo esta bien
            return res.status(200).json({
                ok: true,
                medico: edicionDocumento
                    //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
            });

        });
    });
});

// =========================================================
// POST: Crear un nuevo médico
// =========================================================
rutas.post('/', mwAutenticacion.verificaToken, (req, res) => {

    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    var body = req.body;

    //body.usuario = req.usuarioToken._id; // Añadido a la petición en mwAutenticacion.verificaToken

    // Creamos al médico enviado en la petición
    var medico = new Medico({
        nombre: body.nombre,
        img: body.img,
        usuario: req.usuarioToken._id, // Añadido a la petición en mwAutenticacion.verificaToken
        hospital: body.hospital // Nota: Se recibirá el id del hospital desde el frontend (problablemente desde algún input de form)
    });

    // Guardamos al médico en la BD
    medico.save((err, nuevoDocumento) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear médico.",
                errors: err
            });
        }

        // Si todo esta bien
        return res.status(201).json({
            ok: true,
            medico: nuevoDocumento
                //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });
    });
});

// =========================================================
// DELETE: Eliminar un médico
// =========================================================
rutas.delete('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;

    // Buscamos por la existencia del médico con la función findByIdAndDelete de mongoose
    // Nota: También existe la función findByIdAndRemove pero se recomienda usar AndDelete
    Medico.findByIdAndDelete(id, (err, eliminadoDocumento) => {

        // Si hubo algún error en la eliminación
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al eliminar el médico",
                errors: err
            });
        }

        // Si no hay un documento (medico) que eliminar
        if (!eliminadoDocumento) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un médico con id " + id + ".",
                errors: { message: "No existe un médico con ese ID" }
            });
        }

        // Si todo esta bien
        return res.status(200).json({
            ok: true,
            medico: eliminadoDocumento
                //usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });
    });
});



module.exports = rutas;