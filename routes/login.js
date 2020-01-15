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

// Google
var CLIENT_ID = require('../config/config').CLIENT_ID;
// Nota: Google recomienda usar una destructurazión para obtener el OAuth2Client de su librería
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// Usaremos middlewares de autenticación para verificar el token y renovarlo
var mwAutenticacion = require('../middlewares/autenticacion');


// =========================================================
// GET: Renovar token (requiere de un token aún válido)
// =========================================================
rutas.get('/renuevatoken', mwAutenticacion.verificaToken, (req, res) => {

    // El middleware verificaToken, en caso de ser satisfactorio, crea un usuarioToken en req,
    // entonces vamos a generar un token válido por 4 horas más:
    // Nota: Es importante aclarar que los tokens generados de esta forma mueren hasta que terminen
    //       su tiempo de vida, es decir, no sustituyen a algún otro.
    var token = jwt.sign({ usuario: req.usuarioToken }, SEED, { expiresIn: 14400 }); // 4 horas

    res.status(200).json({
        ok: true,
        //usuario: req.usuarioToken,
        token: token
    });

});


// =========================================================
// POST: [Forma 1] Autenticar a un usuario (normal)
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
            id: documentoUsuario._id,
            menu: obtenerMenu(documentoUsuario.role)
        });

    });

});


// =========================================================
// POST: [Forma 2] Autenticar a un usuario (con Google SignIn)
// =========================================================
// TIP: Usaremos async para que podamos también usar await, ya que nuestra función verify es async
rutas.post('/google', async(req, res) => {
    // Nota: Google recomienda usar POST.

    // Gracias a la librería 'Body Parser', podemos usar su método body para obtener los parámetros
    // x-www-form-urlencoded enviados en la petición.
    var token = req.body.token;

    // Para usar este await tuvimos que usar async (req, res), es un truco útil.
    var googleUser = await verify(token).catch(err => {
        return res.status(403).json({
            ok: false,
            mensaje: 'Token no válido'
        });
    });

    // Vamos a buscar en nuestra BD por el email obtenido de Google con el fin de determinar
    // cómo es que dicho email existe, ya que un usuario que este registrado en nuestra BD solo
    // pudo haber sido o por la Forma 1 (autenticación normal) o por esta Forma 2 con Google SignIn.
    // Nota: ¡Estas formas son excluyentes! ya que no podemos tener un usuario con doble inicio se sesión,
    //       por este motivo nuestra colección Usuario tiene un atributo llamado 'google', que nos
    //       indica si es un usuario registrado con Google SignIn o con nuestro propio sistema de SignIn. 
    Usuario.findOne({ email: googleUser.email }, (err, documentoUsuario) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // Si efectivamente existe ese usuario en nuestra BD, debemos asegurarnos de que no se trate de
        // una re-autenticación
        if (documentoUsuario) {
            // Si 'google' es false, quiere decir que este documentoUsuario no puede autenticarse porque
            //                       previamente el email ya se ha autenticado (existe) en nuestra app.
            if (documentoUsuario.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe usar autenticación propia de la app'
                });
            } else {
                // Si 'google' es true, quiere decir que este documentoUsuario se creo por Google SignIn,
                //                      puede entonces autenticarse.

                // Como el usuario se autentico correctamente, generamos su JWT (JSON Web Token):
                // ¡PERO ANTES! Solo de manera visual mandamos un emoticon en vez de nuestra contraseña encriptada.
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
                    id: documentoUsuario._id,
                    menu: obtenerMenu(documentoUsuario.role)
                });
            }

        } else {
            // El usuario no existe y deberá crearse...
            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.primer_apellido = googleUser.apellidos;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ';P';

            usuario.save((err, nuevoDocumento) => {

                // Si hubo algún error en la inserción
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: "Error al crear usuario.",
                        errors: err
                    });
                }

                var token = jwt.sign({ usuario: nuevoDocumento }, SEED, { expiresIn: 14400 }); // 4 horas

                // Si todo esta bien
                res.status(201).json({
                    ok: true,
                    usuario: nuevoDocumento,
                    token: token,
                    id: nuevoDocumento._id,
                    menu: obtenerMenu(nuevoDocumento.role)
                });

            });

        }

    });

    // return res.status(200).json({
    //     ok: true,
    //     googleUser: googleUser
    // });

});

// Nota: async y await es una característica presente a partir de ES8, realmente funcionan como las promesas
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    //console.log(payload); // Tip: Puede mandarse en el return abajo para ver que contiene
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.given_name,
        apellidos: payload.family_name,
        email: payload.email,
        img: payload.picture,
        google: true,
        //payload
    };
}
//verify(token).catch(console.error);

function obtenerMenu(ROLE) {
    // Este menú será construido dinámicamente de acuerdo al perfil del usuario.
    // Nota: Para este ejemplo estará en duro aquí pero se recomienda que este tipo de menús
    //       provengan de la BD para dar más dinamismo.
    var menu = [{
            titulo: 'Principal',
            icono: 'mdi mdi-gauge',
            submenu: [
                { titulo: 'Dashboard', url: '/dashboard' },
                { titulo: 'ProgressBar', url: '/progress' },
                { titulo: 'Gráficas', url: '/grafica1' },
                { titulo: 'Promesas', url: '/promesas' },
                { titulo: 'RxJs', url: '/rxjs' },
            ]
        },
        {
            titulo: 'Mantenimiento',
            icono: 'mdi mdi-folder-lock-open',
            submenu: [
                //{ titulo: 'Usuarios', url: '/usuarios' },
                { titulo: 'Hospitales', url: '/hospitales' },
                { titulo: 'Médicos', url: '/medicos' }
            ]
        }
    ];

    // Para agregar elementos de acuerdo al rol del usuario, si este menú estuviera en una BD se haría
    // con selects, pero aquí podemos usar funciones de array para insertar elementos al arreglo de menú:
    if (ROLE === 'ADMIN_ROLE') {
        menu[1].submenu.unshift({ titulo: 'Usuarios', url: '/usuarios' });
    }

    return menu;
}


module.exports = rutas;