const express = require('express');
const router = express.Router();

const {
    registerDasher,
    getDasherProfile,
    getAvailableDeliveries,
    acceptDelivery,
    getDeliveryRoute,
    getHeatmap
} = require('../controllers/dasherController');

// Register as a Dasher
router.post('/dashers', registerDasher);

// Get Dasher profile
router.get('/dashers/:id', getDasherProfile);

// View available deliveries nearby
router.get('/deliveries/available', getAvailableDeliveries);

// Accept a delivery
router.post('/deliveries/:id/accept', acceptDelivery);

// Get route suggestion
router.get('/deliveries/:id/route', getDeliveryRoute);

// Get urgency + proximity heatmap
router.get('/heatmap', getHeatmap);

module.exports = router;