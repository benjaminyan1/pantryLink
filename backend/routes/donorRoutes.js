const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling image uploads
const upload = multer({ storage: multer.memoryStorage() });

// Import controllers (you'll need to create these)
const {
    createDonation,
    uploadDonationImage,
    getDonation,
    updateDonation,
    deleteDonation,
    getDonationMatches,
    getNearbyNonprofits
} = require('../controllers/donorController');

// Create a new donation
router.post('/donations', createDonation);

// Upload an image for pantry recognition
router.post('/donations/image', upload.single('image'), uploadDonationImage);

// Get a specific donation
router.get('/donations/:id', getDonation);

// Update a donation
router.put('/donations/:id', updateDonation);

// Delete a donation
router.delete('/donations/:id', deleteDonation);

// Get recommended nonprofits based on listed items
router.get('/donations/matches', getDonationMatches);

// Get nearby nonprofits with matching needs
router.get('/nonprofits/nearby', getNearbyNonprofits);

module.exports = router; 