'use strict';
const express = require('express');
const router = express.Router();

// get typing-training page
// ログインしていなくても閲覧可能
router.get('/', (req, res, next) => {
  res.render('typing-training', { user: req.user });
});

module.exports = router;