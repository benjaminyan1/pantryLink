const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Donor = require('../models/Donor');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    const uploadPath = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});


const uploadMiddleware = (req, res, next) => {
  const uploader = upload.single('image');
  
  uploader(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: `Upload error: ${err.message}`,
        code: err.code
      });
    } else if (err) {
      
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
    
    
    next();
  });
};


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


router.post('/donations', createDonation);


router.post('/donations/image-to-donation', uploadMiddleware, processImageAndCreateDonation);


router.post('/donations/image', upload.single('image'), uploadDonationImage);


router.get('/donors/:id', getDonor);


router.put('/donations/:id', updateDonation);


router.delete('/donations/:id', deleteDonation);


router.get('/donations/matches', getDonationMatches);


router.get('/nonprofits/nearby', getNearbyNonprofits);


router.delete('/donations/by-item/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    const donationIndex = donor.donations.findIndex(d => d.item.toString() === itemId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    
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


router.put('/donations/by-item/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { donorId, quantity, expirationDate, status, imageUrl } = req.body;

    if (!donorId) {
      return res.status(400).json({ error: 'donorId is required' });
    }

    
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    
    const donationIndex = donor.donations.findIndex(d => d.item.toString() === itemId);
    
    if (donationIndex === -1) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    
    
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
