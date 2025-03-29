const Delivery = require('../models/delivery');
const Item = require('../models/item');

// Create a delivery
const createDelivery = async (req, res) => {
    try {
        const {
            donation,
            donor,
            nonprofit,
            pickup,
            dropoff,
            items
        } = req.body;

        // Verify all items exist
        for (let item of items) {
            const itemExists = await Item.findById(item.item);
            if (!itemExists) {
                return res.status(400).json({ 
                    error: `Item with ID ${item.item} not found` 
                });
            }
        }

        const delivery = await Delivery.create({
            donation,
            donor,
            nonprofit,
            pickup,
            dropoff,
            items,
            status: 'pending'
        });

        // Populate item details before sending response
        await delivery.populate('items.item');
        
        res.status(201).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// View a delivery
const getDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('donor')
            .populate('nonprofit')
            .populate('dasher')
            .populate('items.item');

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'picked_up', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Must be pending, picked_up, delivered, or cancelled' 
            });
        }

        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        // Update status and corresponding timestamp
        delivery.status = status;
        if (status === 'picked_up') {
            delivery.pickedUpAt = new Date();
        } else if (status === 'delivered') {
            delivery.deliveredAt = new Date();
        }

        await delivery.save();
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// View all deliveries for a user
const getUserDeliveries = async (req, res) => {
    try {
        const userId = req.params.id;
        const userType = req.query.type; // 'donor', 'dasher', or 'nonprofit'

        let query = {};
        if (userType === 'donor') {
            query.donor = userId;
        } else if (userType === 'dasher') {
            query.dasher = userId;
        } else if (userType === 'nonprofit') {
            query.nonprofit = userId;
        } else {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        const deliveries = await Delivery.find(query)
            .populate('donor')
            .populate('nonprofit')
            .populate('dasher')
            .sort({ createdAt: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createDelivery,
    getDelivery,
    updateDeliveryStatus,
    getUserDeliveries
}; 