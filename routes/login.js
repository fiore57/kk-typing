'use strict';
const express = require('express');
const router = express.Router();

// get login page
router.get('/', (req, res, next) => {
  res.render('login', { user: req.user });
});

module.exports = router;