var mongoose = require('mongoose');
// Plugin para que MongoDB nos devuelva mensajes de error al validar 'unique' más claros.
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var medicoSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: [true, 'El id del hospital es requerido'] }
});

// TIP: La palabra {PATH} es por si se tienen más claves (columnas) que tengan la condición unique.
medicoSchema.plugin(uniqueValidator, { message: '{PATH} debe ser único.' });

// Para poder usar este esquema afuera de esta clase:
module.exports = mongoose.model('Medico', medicoSchema);