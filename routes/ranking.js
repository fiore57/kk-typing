'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Ranking = require('../models/ranking');
const User = require('../models/user');
const moment = require('moment-timezone');

router.get('/', authenticationEnsurer, (req, res, next) => {
  Ranking.findAll({
    include: [
      {
        model: User,
        attributes: ['userId', 'username']
      }
    ],
    // 同じタイムの場合、昔の記録の方が順位は上
    order: [['time', 'ASC'], ['updatedAt', 'ASC']]
  }).then(rankings => {
    rankings.forEach((ranking) => {
      // 更新日のみを表示するようフォーマット
      ranking.formattedUpdatedAt = moment(ranking.updatedAt).tz('Azia/Tokyo').format('YYYY/MM/DD');
    });
    res.render('ranking', {
      user: req.user,
      rankings: rankings
    });
  });
});

router.post('/api/ranking', authenticationEnsurer, (req, res, next) => {
  // ランキングの upsert
  console.log(req.body);
  const resultTimeMs = req.body.timeMs;
  const userId = req.user.id;
  Ranking.upsert({
    time: req.body.timeMs,
    createdBy: userId,
    updatedAt: new Date()
  });
  // TODO: レスポンスを返す
  // TODO: エラーハンドリング
});

module.exports = router;