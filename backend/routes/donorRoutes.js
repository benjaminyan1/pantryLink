const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads with improved error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create path if it doesn't exist
    const uploadPath = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

// Add file filter to only allow certain types of images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Update multer config with limits and error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

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
