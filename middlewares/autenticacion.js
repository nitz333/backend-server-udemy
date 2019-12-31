// Librería para generación de tokens
var jwt = require('jsonwebtoken');
// Importamos una constante en particular de nuestro archivo de configuración (al vuelo)
var SEED = require('../config/config').SEED;


// =========================================================
// Verificación de token
// =========================================================
exports.verificaToken = function(req, res, next) {

    // Recibimos el token (si lo incluye la petición) por URL, para eso usamos la función query.
    // Nota: Recibir el token por query es muy conveniente, si no se envía, el token valdrá undefine,
    //       en consecuencia el middleware fallará y no permitirá la ejecución de código de peticiones
    //       que usen este middleware. 
    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token inválido',
                errors: err
            });
        }

        // res.status(200).json({
        //     ok: true,
        //     decoded: decoded
        // });

        // Si el token es válido, nos sirve de mucho saber que usuario realizó la petición, esto se puede
        // extraer del decoded. Vamos a añadirle a la petición un parametro 'usuario' con dicho usuario:
        req.usuarioToken = decoded.usuario;

        // Le indicamos al middleware que permita continuar con el código de quien lo solicitó.
        next();

    });

};