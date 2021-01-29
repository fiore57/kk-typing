'use strict';
const express = require('express');
const router = express.Router();

// get home page
router.get('/', (req, res, next) => {
  res.render('index', { user: req.user });
});

module.exports = router;
