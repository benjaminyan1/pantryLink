const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        required: true
    },
    nonprofit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nonprofit',
        required: true
    },
    dasher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dasher',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'],
        default: 'pending'
    },
    pickup: {
        address: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    dropoff: {
        address: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        quantity: Number
    }],  
    estimatedTime: {
        type: Number, 
        default: 30
    },
    distance: {
        type: Number,  
        default: 0
    },
    notes: String,
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date
}, {
    timestamps: true
});

deliverySchema.index({ "pickup.location": "2dsphere" });
deliverySchema.index({ "dropoff.location": "2dsphere" });

module.exports = mongoose.model('Delivery', deliverySchema); 