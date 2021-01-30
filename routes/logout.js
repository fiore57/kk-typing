'use strict';
const express = require('express');
const router = express.Router();

// get logout page
router.get('/', (req, res, next) => {
  req.logout();
  res.redirect('/'); // redirect to home page
});

module.exports = router;