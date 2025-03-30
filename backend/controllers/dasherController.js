const Dasher = require('../models/Dasher');
const Delivery = require('../models/delivery');


function calculateUrgencyScore(delivery) {
    
    return delivery.urgencyLevel || 1;
  }


const registerDasher = async (req, res) => {
    try {
        const { auth0Id, name, email, phone, vehicle } = req.body;
        
        
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


const getAvailableDeliveries = async (req, res) => {
    try {
        const { lat, lng, radius = 10000 } = req.query; 

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


const acceptDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const dasherId = req.body.dasherId; 

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


const getDeliveryRoute = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        
        
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


const getHeatmap = async (req, res) => {
    try {
        const { bounds } = req.query;

        
        const deliveries = await Delivery.find({ status: 'pending' });

        
        const heatmapData = deliveries.map(delivery => ({
            location: delivery.pickup,
            weight: calculateUrgencyScore(delivery) 
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