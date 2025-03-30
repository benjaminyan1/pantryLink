const mongoose = require("mongoose");

const nonprofitSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true },
  organizationName: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: { type: [String], default: [] },
  contactPerson: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  address: { type: String, required: true },
  role: { type: String, default: "nonprofit" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  needs: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
      quantity: { type: Number, required: true },
      urgency: { 
        type: Number, 
        min: [0, 'Urgency must be at least 0'], 
        max: [100, 'Urgency must be at most 100'], 
        required: true
      }
    }
  ],

  upcomingDeliveries:
     [{ type: mongoose.Schema.Types.ObjectId, ref: "Delivery" }]
});

module.exports = mongoose.model("Nonprofit", nonprofitSchema);
