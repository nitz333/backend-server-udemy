var mongoose = require('mongoose');
// Plugin para que MongoDB nos devuelva mensajes de error al validar 'unique' más claros.
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolesValidos = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} no es un rol permitido'
};


var usuarioSchema = new Schema({

    'nombre': { type: String, required: [true, 'El nombre es necesario'] },
    'primer_apellido': { type: String, required: [true, 'El primer apellido es necesario'] },
    'segundo_apellido': { type: String, required: false },
    'email': { type: String, unique: true, required: [true, 'El email es necesario'] },
    'password': { type: String, required: [true, 'La contraseña es necesaria'] },
    'img': { type: String, required: false },
    'role': { type: String, required: true, default: 'USER_ROLE', enum: rolesValidos }

});

// TIP: La palabra {PATH} es por si se tienen más claves (columnas) que tengan la condición unique.
usuarioSchema.plugin(uniqueValidator, { message: '{PATH} debe ser único.' });

// Para poder usar este esquema afuera de esta clase:
module.exports = mongoose.model('Usuario', usuarioSchema);