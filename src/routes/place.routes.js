const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');

router.get('/', placeController.getPlaces);
router.get('/:id', placeController.getPlaceDetail);

module.exports = router;