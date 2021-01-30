'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Ranking = require('../models/ranking');
const User = require('../models/user');
const moment = require('moment-timezone');
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const asyncHandler = require('express-async-handler');

// get ranking page
router.get('/', authenticationEnsurer, asyncHandler(async (req, res, next) => {
  // ランキングを順位と共に取得
  // SELECT RANK() OVER (ORDER BY time ASC) AS rank, * FROM rankings ORDER BY time ASC, "updatedAt" ASC; みたいな感じ
  const rankings = await Ranking.findAll({
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
  });

  // 更新日のみを表示するようフォーマット
  rankings.forEach(ranking => {
    ranking.formattedUpdatedAt = moment(ranking.updatedAt).tz('Azia/Tokyo').format('YYYY/MM/DD');
  });

  res.render('ranking', {
    user: req.user,
    rankings: rankings
  });
}));

module.exports = router;