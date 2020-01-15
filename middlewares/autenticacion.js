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

// =========================================================
// Verificación de role ADMIN_ROLE
// =========================================================
exports.verificaAdminRole = function(req, res, next) {

    // Nota: No necesitamos verificar token porque eso ya lo hace el middleware previo (verificaToken),
    //       además ese middleware ya nos creo al usuario, esto es gracias al next() que arrojó al final
    //       y que este nuevo middleware que estamos creando esta escrito físicamente debajo de él, por eso
    //       el orden en los middlewares que arrojan next() es muy importante.
    var usuario = req.usuarioToken;

    if (usuario.role === 'ADMIN_ROLE') {
        // Le indicamos al middleware que permita continuar con el código de quien lo solicitó.
        next();
        return; // Este return está demás, ya que el next() anterior nos saca, pero no vaya a ser el diablo!
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token inválido. dev:->No es ADMIN_ROLE',
            errors: { message: 'Acción permitida solo para administradores' }
        });
    }

};

// =========================================================
// Verificación de role ADMIN_ROLE o mismo id de usuario
// =========================================================
exports.verificaAdminRoleOMismoId = function(req, res, next) {

    // Nota: No necesitamos verificar token porque eso ya lo hace el middleware previo (verificaToken),
    //       además ese middleware ya nos creo al usuario, esto es gracias al next() que arrojó al final
    //       y que este nuevo middleware que estamos creando esta escrito físicamente debajo de él, por eso
    //       el orden en los middlewares que arrojan next() es muy importante.
    var usuario = req.usuarioToken;
    // Este middleware se usará en una petición donde se reciba como parámetro un id, de lo contrario no funcionará.
    // Asumamos que es así:
    var id = req.params.id;

    if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {
        // Le indicamos al middleware que permita continuar con el código de quien lo solicitó.
        next();
        return; // Este return está demás, ya que el next() anterior nos saca, pero no vaya a ser el diablo!
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token inválido. dev:->No es ADMIN_ROLE o mismo usuario',
            errors: { message: 'Acción permitida solo para administradores o mismo usuario' }
        });
    }

};