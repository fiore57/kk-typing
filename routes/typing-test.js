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

/**
 * 各ユーザーが計測を開始した時間の連想配列
 * @type {Map<number, number>}
 */
const startTimeMap = new Map();

// 計測を開始するときに呼び出す API
// /api/record に送信されるタイムが不正でないかを確かめるため（気休め程度）
router.post('/api/start', authenticationEnsurer, csrfProtection, asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  startTimeMap.set(userId, Date.now());
  res.json({
    status: 'OK'
  });
}));

// 記録を Record に追加する API
router.post('/api/record', authenticationEnsurer, csrfProtection, asyncHandler(async (req, res, next) => {
  const timeMs = req.body.timeMs;
  const userId = req.user.id;

  // startTime が登録されていない場合、不正と判断する
  if (!startTimeMap.has(userId)) {
    res.json({
      status: 'NG'
    });
    return;
  }
  /**
   * /api/start にリクエストがあった時間と /api/record に
   * リクエストがあった時間から推定したタイム
   * @type {number}
   */
  const estimatedTimeMs = Date.now() - startTimeMap.get(userId);
  // 送信されたタイムと推定タイムの差が 5 秒より大きい場合、不正と判断する
  if (Math.abs(estimatedTimeMs - timeMs) > 5000) {
    res.json({
      status: 'NG'
    });
    return;
  }
  startTimeMap.delete(userId);

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
  const timeMs = req.body.timeMs;
  const userId = req.user.id;

  /**
   * Record に登録されている記録のうち、タイムが一致する記録
   *
   * 存在しない場合、null
   * @type {Object|null}
   */
  const record = await Record.findOne({
    where: {
      createdBy: userId,
      time: timeMs
    },
    raw: true,
    nest: true
  });
  // Record にそのタイムが登録されていない場合、不正と判断する
  if(!record) {
    res.json({
      status: 'NG'
    });
    return;
  }

  // ランキングの upsert
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