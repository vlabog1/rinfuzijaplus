const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    products: [
         {
          product: { type: Object, required: true },
          quantity: { type: Number, required: true }
         }
    ],
    user: {
        firstname: {
            type: String,
            required: true
         },
         lastname: {
            type: String,
            required: true
         },
         streetaddress: {
            type: String,
            required: true
         },
         housenumber: {
          type: String,
          required: true
         },
         towncity: {
          type: String,
          required: true
         },
         postcodezip: {
          type: String,
          required: true
         },
         phone: {
          type: String,
          required: true
         },
         email: { 
            type: String,
            required: true
         },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);