'use strict';

import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import assert from './lib/assert';
import * as utils from './lib/utils';
import TypingTraining from './typing-training';

const typingInputArea = $('#typingInput');
const resultArea = $('#result')
const resultBodyArea = $('#resultBody');
const outputArea = $('#output');
const resultButtonsArea = $('#resultButtons');
const sendRecordToRankingButtonArea = $('#sendRecordToRanking');
const retryButtonArea = $('#retryButton');
const csrfTokenArea = $('#csrfToken');

class TypingTest extends TypingTraining {
  constructor(typingTextList) {
    super(typingTextList);
  }
  /**
   * 開始処理
   *
   * TypingTest 特有の開始処理を含む
   */
  _start() {
    super.start(); // TypingTraining の開始処理
    // /typing-test/api/start に POST
    $.post('/typing-test/api/start', { '_csrf': csrfTokenArea.val() }, 'json').then(
      object => {
        assert.defined(object.status);
        assert.eq(object.status, 'OK');
      },
      error => {
        outputCannotStartTypingTest();
      }
    );
  }
  /**
   * リセット処理
   *
   * TypingTest 特有のリセット処理を含む
   */
  _reset() {
    super.reset(); // TypingTraining のリセット処理
    sendRecordToRankingButtonArea.hide();
    sendRecordToRankingButtonArea.prop('disabled', false);
    sendRecordToRankingButtonArea.text('ネットランキングに記録を送信');
  }
  /**
   * 打ち終わったときの処理
   *
   * TypingTest 特有の処理のため、オーバーライドする
   */
  finish() {
    super.isInTraining = false;
    assert.defined(super.timer);
    super.timer.stop();

    const resultTimeMs = super.resultTimeMs;
    if (resultTimeMs < 0) {
      outputArea.text('計測に失敗しました');
      return;
    }

    // 結果を記録する
    const resultObject = {
      'timeMs': resultTimeMs,
      '_csrf': csrfTokenArea.val()
    };
    $.post('/typing-test/api/record', resultObject, 'json').then(
      object => {
        assert.defined(object.status);
        if (object.status === 'NG') {
          outputCannotSaveResultError();
          return;
        }
        assert.eq(object.status, 'OK');
        assert.defined(object.recordRank, object.canUpdateRanking);
        const recordRank = parseInt(object.recordRank);
        const canUpdateRanking = object.canUpdateRanking;

        // 結果の表示
        /**
         * 表示するタイム (s)
         *
         * 小数第3位まで
         * @type {string}
         */
        const displayTime = (resultTimeMs / 1000).toFixed(3);
        /**
         * typingText の文字数
         * @type {number}
         */
        const charCount = super.typingTextCharCount;
        /**
         * 表示する「文字/秒」
         *
         * 小数第2位まで
         * @type {string}
         */
        const displayCharPerSecond = (charCount / (resultTimeMs / 1000)).toFixed(2);
        /**
         * 表示する「文字/分」
         *
         * 小数第2位まで
         * @type {string}
         */
        const displayCharPerMinute = (charCount / (resultTimeMs / (1000 * 60))).toFixed(2);
        /**
         * 表示するメッセージ
         * @type {string}
         */
        const displayMessage =
          recordRank === 1
            ? `新記録達成！`
            : `第 ${recordRank} 位`;
        // WARNING: エスケープされていない文字列を入れないこと！！！
        resultBodyArea.html(
          `Time: ${utils.escapeText(displayTime)} 秒<br>` +
          `${utils.escapeText(displayCharPerSecond)} 文字/秒<br>` +
          `${utils.escapeText(displayCharPerMinute)} 文字/分<br>` +
          `${utils.escapeText(displayMessage)}`
        );

        resultArea.show();
        resultButtonsArea.show();

        if (canUpdateRanking) {
          sendRecordToRankingButtonArea.show();
        }
      },
      error => {
        outputCannotSaveResultError();
      }
    );
  }
}

let typingTest;

// typingTextList を取得
$.get('/typing-test/api/get-text').then(
  object => {
    assert.defined(object.textList);
    const typingTextList = object.textList;
    typingTest = new TypingTest(typingTextList);
    initialize();
  },
  error => {
    outputArea.text('文章の取得に失敗しました');
  }
);

/**
 * typingTextList の取得が終わってから実行する処理
 */
function initialize() {
  // タイピングテストの開始・リセット用
  $(document.body).on('keydown', event => {
    const startKeyList = ['Enter'];
    const resetKeyList = ['Escape'];
    if (!typingTest.isInTraining && startKeyList.includes(event.key)) {
      typingTest._start();
    }
    else if (resetKeyList.includes(event.key)) {
      // Vimmium を使っていると、typingInputArea にフォーカスがあるときに Esc が検出されない
      typingTest._reset();
    }
  });

  // タイピングテスト中、入力した文字列の確定用
  typingInputArea.on('change', event => {
    if (typingTest.isInTraining) {
      const inputText = typingInputArea.val();
      typingTest.input(inputText);
    }
  });

  // 「ネットランキングに記録を送信」ボタン
  sendRecordToRankingButtonArea.on('click', () => {
    // ボタンを無効化
    sendRecordToRankingButtonArea.prop('disabled', true);

    const resultTimeMs = typingTest.resultTimeMs;
    if (resultTimeMs <= 0) {
      outputCannotSendRecordError();
      return;
    }

    // 記録を送信する
    const resultObject = {
      'timeMs': resultTimeMs,
      '_csrf': csrfTokenArea.val()
    };
    $.post('/typing-test/api/ranking', resultObject, 'json').then(
      object => {
        assert.defined(object.status);
        if (object.status === 'NG') {
          outputCannotSendRecordError();
          return;
        }
        assert.eq(object.status, 'OK');
        assert.defined(object.rankingRank);
        showModal('記録を送信しました', `あなたの記録は ${object.rankingRank} 位です`);
        sendRecordToRankingButtonArea.text('記録を送信しました');
      },
      error => {
        outputCannotSendRecordError();
      }
    );
  });

  // 「リトライ」ボタン
  retryButtonArea.on('click', () => {
    typingTest._reset();
  });

}

/**
 * モーダルを出す
 * @param {string} title モーダルのタイトル
 * @param {string} body モーダルの本文
 */
function showModal(title, body) {
  assert.defined(title, body);
  const modalArea = $('#modal');
  modalArea.modal('show');
  const modalTitleArea = $('#modalTitle');
  modalTitleArea.text(title);
  const modalBodyArea = $('#modalBody');
  modalBodyArea.text(body);
}

/**
 * 計測を開始できなかった旨のエラーを出力
 */
function outputCannotStartTypingTest() {
  outputArea.text('計測を開始できませんでした。F5 キーを押してページをリロードしてください。');
}
/**
 * 記録を保存できなかった旨のエラーを出力
 */
function outputCannotSaveResultError() {
  outputArea.text('記録の保存に失敗しました。F5 キーを押してページをリロードしてください。');
}
/**
 * 記録をネットランキングに送信できなかった旨のエラーを出力
 */
function outputCannotSendRecordError() {
  outputArea.text('記録をネットランキングに送信できませんでした。F5 キーを押してページをリロードしてください。');
}

// コピー禁止
$(document.body).on('copy', e => { e.preventDefault(); });
// ペースト禁止
typingInputArea.on('paste', e => { e.preventDefault(); });