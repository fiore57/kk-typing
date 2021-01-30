'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Record = require('../models/record');
const Ranking = require('../models/ranking');
const fs = require('fs');
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const asyncHandler = require('express-async-handler');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// get typing-test page
router.get('/', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.render('typing-test', { user: req.user, csrfToken: req.csrfToken() });
});

const kenpoText = fs.readFileSync('./dat/kenpo.txt', { encoding: 'utf-8', flag: 'r' });
const kenpoTextList = kenpoText.trim().split('\n');
// テキストを取得する API
router.get('/api/get-text', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.json({
    textList: kenpoTextList
  });
});

// 記録を Record に追加する API
router.post('/api/record', authenticationEnsurer, csrfProtection, asyncHandler(async (req, res, next) => {
  const timeMs = req.body.timeMs;
  const userId = req.user.id;
  await Record.create({
    time: timeMs,
    createdBy: userId,
    updatedAt: new Date()
  });

  /**
   * Record 内における、今の記録の順位（1-based）
   * @type {number}
   */
  const recordRank = await Record.count({
    // 今の記録のタイム未満の記録の数を取得
    where: {
      createdBy: userId,
      time: {
        [Sequelize.Op.lt]: timeMs
      },
    },
  }) + 1;

  /**
   * Ranking に登録されている記録
   *
   * 存在しない場合、null
   * @type {Object|null}
   */
  const ranking = await Ranking.findByPk(userId, { raw: true, nest: true });

  /**
   * ランキングが更新可能かどうか
   *
   * (ランキングに記録が存在しない or ランキングの記録よりも今の記録の方が上) ならば true
   * @type {boolean}
   */
  const canUpdateRanking = ((!ranking) || timeMs < ranking.time);

  res.json({
    status: 'OK',
    recordRank: recordRank,
    canUpdateRanking: canUpdateRanking
  });
}));

// 記録を Ranking に追加する API
router.post('/api/ranking', authenticationEnsurer, csrfProtection, asyncHandler(async (req, res, next) => {
  // ランキングの upsert
  const timeMs = req.body.timeMs;
  const userId = req.user.id;
  await Ranking.upsert({
    time: timeMs,
    createdBy: userId,
    updatedAt: new Date()
  });

  /**
   * Ranking 内における、今の記録の順位（1-based）
   * @type {number}
   */
  const rankingRank = await Ranking.count({
    // 今の記録のタイム未満の記録の数を取得
    where: {
      createdBy: userId,
      time: {
        [Sequelize.Op.lt]: timeMs
      },
    },
  }) + 1;

  res.json({
    status: 'OK',
    rankingRank: rankingRank
  });
}));

module.exports = router;