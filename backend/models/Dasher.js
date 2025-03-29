const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeliverySchema = new Schema({
  donorId: { type: Schema.Types.ObjectId, required: true },
  nonprofitId: { type: Schema.Types.ObjectId, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  status: {
    type: String,
    enum: ['pending', 'in transit', 'delivered'],
    default: 'pending'
  }
}, { _id: false });

const DasherSchema = new Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  location: {
    address: { type: String, required: true },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  ratings: { type: Number, min: 0, max: 5 },
  role: {
    type: String,
    default: 'dasher',
    immutable: true
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String
  },
  isAvailable: { type: Boolean, default: true },
  deliveries: [DeliverySchema]
}, { timestamps: true });

module.exports = mongoose.model('Dasher', DasherSchema); 