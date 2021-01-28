'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Ranking = require('../models/ranking');
const User = require('../models/user');
const moment = require('moment-timezone');
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;

router.get('/', authenticationEnsurer, (req, res, next) => {
  // SELECT RANK() OVER (ORDER BY time ASC) AS rank, * FROM rankings ORDER BY time ASC, "updatedAt" ASC; みたいな感じ
  Ranking.findAll({
    include: [
      {
        model: User,
        attributes: ['userId', 'username'],
      }
    ],
    // 同じタイムの場合、昔の記録の方が上に表示する（が、順位は同率）
    order: [['time', 'ASC'], ['updatedAt', 'ASC']],
    attributes: [
      'time', 'createdBy', 'updatedAt',
      // 順位を取得する
      [Sequelize.literal('(RANK() OVER (ORDER BY time ASC))'), 'rank'],
    ],
    raw: true,
    nest: true
  }).then(rankings => {
    rankings.forEach(ranking => {
      // 更新日のみを表示するようフォーマット
      ranking.formattedUpdatedAt = moment(ranking.updatedAt).tz('Azia/Tokyo').format('YYYY/MM/DD');
    });
    res.render('ranking', {
      user: req.user,
      rankings: rankings
    });
  });
});

module.exports = router;