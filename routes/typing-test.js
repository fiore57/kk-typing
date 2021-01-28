'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Record = require('../models/record');
const Ranking = require('../models/ranking');
const fs = require('fs');
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const Op = Sequelize.Op;

router.get('/', authenticationEnsurer, (req, res, next) => {
  res.render('typing-test', { user: req.user });
});

const kenpoText = fs.readFileSync('./dat/kenpo.txt', { encoding: 'utf-8', flag: 'r' });
const kenpoTextList = kenpoText.trim().split('\n');
// テキストを取得する API
router.get('/api/get-text', authenticationEnsurer, (req, res, next) => {
  res.send({
    textList: kenpoTextList
  });
});

router.post('/api/record', authenticationEnsurer, async (req, res, next) => {
  // then を使うと汚くなるのでここだけ async/await を使用
  try {
    console.log(req.body);
    /**
     * 今の記録のタイム(ms)
     * @type {number}
     */
    const resultTimeMs = req.body.timeMs;
    /**
     * ユーザーID
     * @type {number}
     */
    const userId = req.user.id;
    await Record.create({
      time: resultTimeMs,
      createdBy: userId,
      updatedAt: new Date()
    });

    console.log(resultTimeMs);

    /**
     * Record 内における、今の記録の順位（1-based）
     * @type {number}
     */
    const recordRank = await Record.count({
      // 今の記録のタイム未満の記録の数を取得
      where: {
        createdBy: userId,
        time: {
          [Op.lt]: resultTimeMs
        },
      },
    }) + 1;

    /**
     * Ranking に登録されている記録
     *
     * 存在しない場合、null
     * @type {Model|null}
     */
    const ranking = await Ranking.findByPk(userId);

    /**
     * ランキングが更新可能かどうか
     *
     * (ランキングに記録が存在しない or ランキングの記録よりも今の記録の方が上) ならば true
     * @type {boolean}
     */
    const canUpdateRanking = ((!ranking) || resultTimeMs < ranking.time);

    res.json({
      status: 'OK',
      recordRank: recordRank,
      canUpdateRanking: canUpdateRanking
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;