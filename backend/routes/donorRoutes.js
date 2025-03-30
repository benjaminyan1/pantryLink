const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Import controllers
const {
  createDonation,
  uploadDonationImage,
  getDonor,
  updateDonation,
  deleteDonation,
  getDonationMatches,
  getNearbyNonprofits,
  processImageAndCreateDonation
} = require('../controllers/donorController');

// Create a new donation
router.post('/donations', createDonation);

// Upload and process an image to automatically create a donation
router.post('/donations/image-to-donation', upload.single('image'), processImageAndCreateDonation);

// Upload an image for pantry recognition
router.post('/donations/image', upload.single('image'), uploadDonationImage);

// Get a specific Donor (with all donations)
router.get('/donors/:id', getDonor);

// Update a specific donation subdoc within a Donor
router.put('/donations/:id', updateDonation);

// Delete a specific donation subdoc within a Donor
router.delete('/donations/:id', deleteDonation);

// Get recommended nonprofits based on listed items
router.get('/donations/matches', getDonationMatches);

// Get nearby nonprofits with matching needs
router.get('/nonprofits/nearby', getNearbyNonprofits);

module.exports = router;
