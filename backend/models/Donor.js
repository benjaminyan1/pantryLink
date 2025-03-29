const mongoose = require('mongoose');
const { Schema } = mongoose;

const DonationItemSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  expirationDate: Date,
  imageUrl: String,
  status: {
    type: String,
    enum: ['available', 'matched', 'delivered'],
    default: 'available'
  }
}, { _id: false });

const DonorSchema = new Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  rating: { type: Number, min: 0, max: 5 },
  donations: [DonationItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Donor', DonorSchema);