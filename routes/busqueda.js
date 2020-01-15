// En primer lugar debemos cargar la librería de 'express':
var express = require('express');

// Inicializamos el express.
var rutas = express();

// Este servicio de ruta va a buscar en diversas colecciones, por tal importamos los modelos respectivos:
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');


// =============================
// Búsqueda por colección
// =============================
// Nota: /la ruta empieza con la palabra /coleccion para que no entre en conflicto con la Búsqueda general
rutas.get('/coleccion/:coleccion/:busqueda', (req, res) => {

    // Obtenemos el parámetro de la colección
    var coleccion = req.params.coleccion;
    // Obtenemos el parámetro de la búsqueda
    var busqueda = req.params.busqueda;
    // Para buscar una cadena en el find de mongoose, necesitamos una expresión regular. Ej: '/norte/i'
    var regexp = new RegExp(busqueda, 'i'); // La i es para que sea insensible a mayúsculas y minúsculas

    var promesa;

    switch (coleccion) {
        case 'usuarios':
            promesa = buscarUsuarios(regexp);
            break;

        case 'hospitales':
            promesa = buscarHospitales(regexp);
            break;

        case 'medicos':
            promesa = buscarMedicos(regexp);
            break;

        default:
            return res.status(400).json({
                ok: false,
                mensaje: "Los tipos de búsqueda son para usuarios, medicos u hospitales",
                errors: { message: "Tipo de colección no válida" }
            });
    }

    promesa.then(resultados => {

        // ES6 dispone de "Propiedades de objetos computadas o procesadas", esto significa que puede
        // sustituir la clave de un atributo de objeto por el contenido de una variable, esto se logra con [propiedad],
        // donde propiedad es el nombre de una variable definida previamente.
        res.status(200).json({
            ok: true,
            [coleccion]: resultados
        });

    });


});



// =============================
// Búsqueda general
// =============================
//////////////////
// NOTA: Para lograr hacer búsquedas en diversas colecciones y traer los resultados de cada una de ellas,
//       no podemos hacerlas en serie ya que la primer búsqueda en retornar enviará los headers a la respuesta
//       y las busquedas pendientes no serán consideradas. Para solventar esto se requiere realizar las
//       búsquedas asíncronamente, para ello usaremos Promesas:
/////////////////

// /todo/:busqueda significa que la busqueda se realizará en todas las colecciones de nuestra BD 
rutas.get('/todo/:busqueda', (req, res, next) => {

    // Obtenemos el parámetro de la búsqueda
    var busqueda = req.params.busqueda;
    // Para buscar una cadena en el find de mongoose, necesitamos una expresión regular. Ej: '/norte/i'
    var regexp = new RegExp(busqueda, 'i'); // La i es para que sea insensible a mayúsculas y minúsculas

    // ECMASCRIPT6 (ES6) incluye una función muy útil para ejecutar un conjunto de promesas llamada all.
    // .all nos permite mandar un arreglo de promesas, ejecutarlas y si todas responden correctamente se
    // ejecuta el then (quien recibe un arreglo ordenado con cada respuesta generada en cada Promesa);
    // si alguna de las promesas falla se ejecuta el catch. 
    Promise.all([
        buscarHospitales(regexp),
        buscarMedicos(regexp),
        buscarUsuarios(regexp)
    ]).then(resultados => {

        res.status(200).json({
            ok: true,
            hospitales: resultados[0],
            medicos: resultados[1],
            usuarios: resultados[2]
        });

    });



});

function buscarHospitales(regexp) {
    return new Promise((resolve, reject) => {

        Hospital.find({ nombre: regexp })
            .populate('usuario', 'nombre primer_apellido segundo apellido email img')
            .exec((err, documentos) => {

                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    resolve(documentos);
                }

            });

    });
}

function buscarMedicos(regexp) {
    return new Promise((resolve, reject) => {

        Medico.find({ nombre: regexp })
            .populate('usuario', 'nombre primer_apellido segundo apellido email img')
            .populate('hospital')
            .exec((err, documentos) => {

                if (err) {
                    reject("Error al cargar médicos", err);
                } else {
                    resolve(documentos);
                }

            });

    });
}

function buscarUsuarios(regexp) {
    return new Promise((resolve, reject) => {

        // Queremos buscar en dos campos dentro del documento de un usuario, en su nombre y su email,
        // para lograr esto usaremos la función or() de mongoose
        Usuario.find({}, 'nombre primer_apellido segundo_apellido email img role')
            .or([{ 'nombre': regexp }, { 'primer_apellido': regexp }, { 'segundo_apellido': regexp }, { 'email': regexp }])
            .exec((err, documentos) => {

                if (err) {
                    reject("Error al cargar usuarios", err);
                } else {
                    resolve(documentos);
                }

            });

    });
}

// Finalmente como vamos a usar este archivo afuera, lo exportamos:
module.exports = rutas;