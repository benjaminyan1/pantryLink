const express = require('express');
const router = express.Router();

const {
    createDelivery,
    getDelivery,
    updateDeliveryStatus,
    getUserDeliveries
} = require('../controllers/deliveryController');

// Create a delivery
router.post('/deliveries', createDelivery);

// View a delivery
router.get('/deliveries/:id', getDelivery);

// Update delivery status
router.put('/deliveries/:id/status', updateDeliveryStatus);

// View all deliveries for a user
router.get('/users/:id/deliveries', getUserDeliveries);

module.exports = router; 