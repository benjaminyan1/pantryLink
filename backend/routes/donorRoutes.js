const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Add this line to import the Donor model
const Donor = require('../models/Donor');

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

// Add a dedicated error-handling middleware for multer
const uploadMiddleware = (req, res, next) => {
  const uploader = upload.single('image');
  
  uploader(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: `Upload error: ${err.message}`,
        code: err.code
      });
    } else if (err) {
      // An unknown error occurred
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
    
    // Everything went fine, proceed
    next();
  });
};

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
router.post('/donations/image-to-donation', uploadMiddleware, processImageAndCreateDonation);

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

// Add this route
router.delete('/donations/by-item/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Find donation index by item ID
    const donationIndex = donor.donations.findIndex(d => d.item.toString() === itemId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Remove the donation using array splice method
    donor.donations.splice(donationIndex, 1);
    await donor.save();
    
    return res.status(200).json({
      message: 'Donation deleted successfully',
      donorId: donor._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route for updating by item ID
router.put('/donations/by-item/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { donorId, quantity, expirationDate, status, imageUrl } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    // Find the donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Find donation index by item ID
    const donationIndex = donor.donations.findIndex(d => d.item.toString() === itemId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    // Update fields if provided
    if (quantity !== undefined) donor.donations[donationIndex].quantity = quantity;
    if (expirationDate !== undefined) donor.donations[donationIndex].expirationDate = expirationDate;
    if (status !== undefined) donor.donations[donationIndex].status = status;
    if (imageUrl !== undefined) donor.donations[donationIndex].imageUrl = imageUrl;

    await donor.save();
    
    return res.status(200).json({
      message: 'Donation updated successfully',
      donation: donor.donations[donationIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
