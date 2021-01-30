'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Record = require('../models/record');
const moment = require('moment-timezone');
const asyncHandler = require('express-async-handler');

// get record page
router.get('/', authenticationEnsurer, asyncHandler(async (req, res, next) => {
  // 自分の記録上位100個を取得
  const records = await Record.findAll({
    where: {
      createdBy: req.user.id
    },
    // 同じタイムの場合、最近の記録の方が順位は上
    order: [['time', 'ASC'], ['updatedAt', 'DESC']],
    raw: true,
    nest: true,
    limit: 100,
  });

  // JST 日本標準時に変換し、フォーマット
  records.forEach(record => {
    record.formattedUpdatedAt = moment(record.updatedAt).tz('Azia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
  });

  res.render('record', {
    user: req.user,
    records: records
  });
}));

module.exports = router;