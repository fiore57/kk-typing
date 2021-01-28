'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Record = require('../models/record');
const moment = require('moment-timezone');

router.get('/', authenticationEnsurer, (req, res, next) => {
  Record.findAll({
    where: {
      createdBy: req.user.id
    },
    // 同じタイムの場合、最近の記録の方が順位は上
    order: [['time', 'ASC'], ['updatedAt', 'DESC']],
    raw: true,
    nest: true
  }).then(records => {
    records.forEach(record => {
      // JST 日本標準時に変換し、フォーマット
      record.formattedUpdatedAt = moment(record.updatedAt).tz('Azia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
    });
    console.log(records);
    res.render('record', {
      user: req.user,
      records: records
    });
  });
});

module.exports = router;