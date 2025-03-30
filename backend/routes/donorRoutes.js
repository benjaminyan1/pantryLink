// const express = require('express');
// const router = express.Router();
// const multer = require('multer'); // For handling image uploads
// const upload = multer({ storage: multer.memoryStorage() });

// // Import controllers (you'll need to create these)
// const {
//     createDonation,
//     uploadDonationImage,
//     getDonation,
//     updateDonation,
//     deleteDonation,
//     getDonationMatches,
//     getNearbyNonprofits
// } = require('../controllers/donorController');


// // Create a new donation
// router.post('/donations', createDonation);

// // Upload an image for pantry recognition
// router.post('/donations/image', upload.single('image'), uploadDonationImage);

// // Get a specific donation
// router.get('/donations/:id', getDonation);

// // Update a donation
// router.put('/donations/:id', updateDonation);

// // Delete a donation
// router.delete('/donations/:id', deleteDonation);

// // Get recommended nonprofits based on listed items
// router.get('/donations/matches', getDonationMatches);

// // Get nearby nonprofits with matching needs
// router.get('/nonprofits/nearby', getNearbyNonprofits);

// module.exports = router; 

const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling image uploads
const upload = multer({ storage: multer.memoryStorage() });

// Import the controller methods
const {
  // For creating and managing donations (subdocs within a Donor)
  createDonation,
  uploadDonationImage,
  updateDonation,
  deleteDonation,
  getDonationMatches,
  getNearbyNonprofits,
  
  // For retrieving the donor itself
  getDonor
} = require('../controllers/donorController');

/**
 * Create a new donation subdocument in a Donor
 * POST /api/donations
 */
router.post('/donations', createDonation);

/**
 * Upload an image for pantry recognition
 * POST /api/donations/image
 */
router.post('/donations/image', upload.single('image'), uploadDonationImage);

/**
 * Get a specific Donor (with all donations)
 * GET /api/donors/:id
 * This is the main fix to ensure you can retrieve a donor document by ID
 */
router.get('/donors/:id', getDonor);

/**
 * Update a specific donation subdoc within a Donor
 * PUT /api/donations/:id
 * (Requires body to include donorId, plus other fields to update)
 */
router.put('/donations/:id', updateDonation);

/**
 * Delete a specific donation subdoc within a Donor
 * DELETE /api/donations/:id
 * (Requires body to include donorId)
 */
router.delete('/donations/:id', deleteDonation);

/**
 * Get recommended nonprofits based on listed items
 * GET /api/donations/matches
 */
router.get('/donations/matches', getDonationMatches);

/**
 * Get nearby nonprofits with matching needs
 * GET /api/nonprofits/nearby
 */
router.get('/nonprofits/nearby', getNearbyNonprofits);

module.exports = router;
