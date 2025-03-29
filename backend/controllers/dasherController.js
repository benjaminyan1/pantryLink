const Dasher = require('../models/Dasher'); // You'll need to create this model
const Delivery = require('../models/delivery'); // You'll need to create this model

// Register as a Dasher
const registerDasher = async (req, res) => {
    try {
        const { name, email, phone, vehicle } = req.body;
        
        // Basic validation
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }

        const dasher = await Dasher.create({
            name,
            email,
            phone,
            vehicle,
            status: 'active',
            currentLocation: null
        });

        res.status(201).json(dasher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Dasher profile
const getDasherProfile = async (req, res) => {
    try {
        const dasher = await Dasher.findById(req.params.id);
        if (!dasher) {
            return res.status(404).json({ error: 'Dasher not found' });
        }
        res.status(200).json(dasher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// View available deliveries nearby
const getAvailableDeliveries = async (req, res) => {
    try {
        const { lat, lng, radius = 10000 } = req.query; // radius in meters

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Location coordinates required' });
        }

        const availableDeliveries = await Delivery.find({
            status: 'pending',
            pickup: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius
                }
            }
        })
        .populate('items.item');

        res.status(200).json(availableDeliveries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept a delivery
const acceptDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const dasherId = req.body.dasherId; // Assuming this comes from authenticated user

        const delivery = await Delivery.findById(id);
        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        if (delivery.status !== 'pending') {
            return res.status(400).json({ error: 'Delivery is no longer available' });
        }

        delivery.status = 'accepted';
        delivery.dasher = dasherId;
        await delivery.save();

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get route suggestion
const getDeliveryRoute = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        // Here you would integrate with a routing service (Google Maps, MapBox, etc.)
        // For now, returning dummy data
        const route = {
            pickup: delivery.pickup,
            dropoff: delivery.dropoff,
            estimatedTime: "30 mins",
            distance: "5.2 km"
        };

        res.status(200).json(route);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get urgency + proximity heatmap
const getHeatmap = async (req, res) => {
    try {
        const { bounds } = req.query;

        // Get all pending deliveries in the area
        const deliveries = await Delivery.find({ status: 'pending' });

        // Calculate heatmap data based on urgency and location
        const heatmapData = deliveries.map(delivery => ({
            location: delivery.pickup,
            weight: calculateUrgencyScore(delivery) // You'll need to implement this
        }));

        res.status(200).json(heatmapData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerDasher,
    getDasherProfile,
    getAvailableDeliveries,
    acceptDelivery,
    getDeliveryRoute,
    getHeatmap
};