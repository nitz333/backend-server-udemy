var mongoose = require('mongoose');
// Plugin para que MongoDB nos devuelva mensajes de error al validar 'unique' más claros.
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var hospitalSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' }
}, { collection: 'hospitales' }); // Para la correcta pluralización

// TIP: La palabra {PATH} es por si se tienen más claves (columnas) que tengan la condición unique.
hospitalSchema.plugin(uniqueValidator, { message: '{PATH} debe ser único.' });

// Para poder usar este esquema afuera de esta clase:
module.exports = mongoose.model('Hospital', hospitalSchema);