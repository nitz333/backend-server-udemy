var express = require('express');
// Librería para encriptar cadenas (en nuestro caso para la contraseña)
var bcrypt = require('bcryptjs');
// Librería para generación de tokens
var jwt = require('jsonwebtoken');
// Importamos una constante en particular de nuestro archivo de configuración (al vuelo)
var SEED = require('../config/config').SEED;

var rutas = express();

// Ya que estas rutas trabajarán con el modelo Usuario, debemos establecerlo para quien quiera crear instancias de éste:
var Usuario = require('../models/usuario');

// =========================================================
// POST: Autenticar a un usuario
// =========================================================
rutas.post('/', (req, res) => {

    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    var body = req.body;

    // Buscamos por la existencia del documento con la función findOne (ya que de existir es único) de mongoose
    Usuario.findOne({ email: body.email }, (err, documentoUsuario) => {

        // Si hubo algún error en la búsqueda
        // Nota: No es error 400 ya que los métodos find* regresan siempre algo, puede ser null, pero si no entonces es un error 500
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // Si no existe el documento
        // Nota: Aquí sí es error 400
        if (!documentoUsuario) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas. dev:->email",
                errors: err
            });
        }

        // En caso de existir compararemos que el email enviado generé el mismo que está encriptado, de lo contrario
        // la contraseña sería incorrecta
        if (!bcrypt.compareSync(body.password, documentoUsuario.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Credenciales incorrectas. dev:->password",
                errors: err
            });
        }

        // Como el usuario se autentico correctamente, generamos su JWT (JSON Web Token):
        // ¡PERO ANTES! Solo de manera visual mandamos un emoticon en vez de nuestra contraseña encriptada.
        // IMPORTANTE: Dado que usaremos la data de documentoUsuario para generar el Token, esta data va a ser
        //             incluida y puede decodificarse (en https://jwt.io), por lo que sustituir la contraseña
        //             en este punto ya no solo es cuestión de estética sino de seguridad.
        documentoUsuario.password = ';P';

        // Nota: la función sign() de jsonwebtoken puede recibir tres parámetros:
        //       la data que quiero colocar en el token (payload);
        //       un string único (puede ser a nivel global de la app) con caracteres inusuales (seed)
        //       el tiempo de expiración del token en milisegundos
        var token = jwt.sign({ usuario: documentoUsuario }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
            ok: true,
            usuario: documentoUsuario,
            token: token,
            id: documentoUsuario._id
        });

    });

});


module.exports = rutas;