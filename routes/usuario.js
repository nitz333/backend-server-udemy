var express = require('express');
// Librería para encriptar cadenas (en nuestro caso para la contraseña)
var bcrypt = require('bcryptjs');
// Librería para generación de tokens (la usamos ya que necesitamos un token en ciertas peticiones)
var jwt = require('jsonwebtoken');
// Usaremos el middleware de autenticación por token para ciertas peticiones
var mwAutenticacion = require('../middlewares/autenticacion');

var rutas = express();

// Ya que estas rutas trabajarán con el modelo Usuario, debemos establecerlo para quien quiera crear instancias de éste:
var Usuario = require('../models/usuario');

// =========================================================
// GET: Obtener todos los usuarios
// =========================================================
rutas.get('/', (req, res, next) => {

    // Hacemos la búsqueda de todos los documentos (registros) de usuarios en la BD
    Usuario.find({}, 'nombre primer_apellido segundo_apellido email img role')
        .exec(
            (err, docs) => {

                // Si hubo algún error en la base de datos
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: "Error al cargar usuarios.",
                        errors: err
                    });
                }

                // Si todo esta bien
                res.status(200).json({
                    ok: true,
                    usuarios: docs
                });

            });

});






// =========================================================
// PUT: Actualizar un usuario (petición PUT o PATCH es prácticamente lo mismo)
// =========================================================
rutas.put('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;
    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    // Nota: por cuestión de gustos todas mis variables las declaro al inicio
    var body = req.body;

    // Buscamos por la existencia del usuario con la función findById de mongoose
    Usuario.findById(id, (err, documento) => {

        // Si hubo algún error en la búsqueda
        // Nota: No es error 400 ya que los métodos find* regresan siempre algo, puede ser null, pero si no entonces es un error 500
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario.",
                errors: err
            });
        }

        // Si no existe el documento
        // Nota: Aquí sí es error 400
        if (!documento) {
            return res.status(400).json({
                ok: false,
                mensaje: "El usuario con id " + id + " no existe.",
                errors: { message: 'No existe el usuario con ese ID' }
            });
        }

        // Dado que el usuario si existe, por este método es pertinente solo modificar estos datos
        documento.nombre = body.nombre;
        documento.primer_apellido = body.primer_apellido;
        documento.segundo_apellido = body.segundo_apellido;
        documento.email = body.email;
        documento.role = body.role;

        // Actualizamos el documento (usuario) en la BD
        documento.save((err, edicionDocumento) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar usuario con id " + id + ".",
                    errors: err
                });
            }

            // Si todo esta bien
            // ¡PERO ANTES! Solo de manera visual mandamos un emoticon en vez de nuestra contraseña encriptada.
            edicionDocumento.password = ';P';
            res.status(200).json({
                ok: true,
                usuario: edicionDocumento,
                usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
            });
        });
    });
});

// =========================================================
// POST: Crear un nuevo usuario
// =========================================================
rutas.post('/', mwAutenticacion.verificaToken, (req, res) => {

    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    var body = req.body;

    // Creamos el usuario enviado en la petición
    var usuario = new Usuario({
        nombre: body.nombre,
        primer_apellido: body.primer_apellido,
        segundo_apellido: body.segundo_apellido,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    // Guardamos el usuario en la BD
    usuario.save((err, nuevoDocumento) => {

        // Si hubo algún error en la inserción
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear usuario.",
                errors: err
            });
        }

        // Si todo esta bien
        res.status(201).json({
            ok: true,
            usuario: nuevoDocumento,
            usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });
    });
});

// =========================================================
// DELETE: Eliminar un usuario
// =========================================================
rutas.delete('/:id', mwAutenticacion.verificaToken, (req, res) => {

    // Obtenemos el id de la petición
    var id = req.params.id;

    // Buscamos por la existencia del usuario con la función findByIdAndDelete de mongoose
    // Nota: También existe la función findByIdAndRemove (como se usa en el video) pero se recomienda usar AndDelete
    Usuario.findByIdAndDelete(id, (err, eliminadoDocumento) => {

        // Si hubo algún error en la eliminación
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al eliminar usuario.",
                errors: err
            });
        }

        // Si no hay un documento (usuario) que eliminar
        if (!eliminadoDocumento) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un usuario con id " + id + ".",
                errors: { message: 'No existe un usuario con ese ID.' }
            });
        }

        // Si todo esta bien
        res.status(200).json({
            ok: true,
            usuario: eliminadoDocumento,
            usuariotoken: req.usuarioToken // Añadido a la petición en mwAutenticacion.verificaToken
        });

    });


});


module.exports = rutas;