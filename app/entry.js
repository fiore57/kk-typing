'use strict';

import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import Timer from './timer';
import assert from './lib/assert';
import * as utils from './lib/utils';

const messageArea = $('#message');
const curTypingTextArea = $('#curTypingText');
const typingInputArea = $('#typingInput');
const nextTypingTextArea = $('#nextTypingText');
const resultArea = $('#result')
const resultBodyArea = $('#resultBody');
const outputArea = $('#output');
const resultButtonsArea = $('#resultButtons');
const sendRecordToRankingButtonArea = $('#sendRecordToRanking');
const retryButtonArea = $('#retryButton');
const csrfTokenArea = $('#csrfToken');

class TypingTest {
  /**
   * タイピングテスト中かどうか
   * @type {boolean}
   */
  #isInTest = false;
  /**
   * タイマー
   * @type {Timer}
   */
  #timer;
  /**
   * 現在入力している this.#typingTextList の index
   *
   * 開始前は -1
   * @type {number}
   */
  #curTypingTextIndex = -1;
  /**
   * 入力する文字列のリスト
   * @type {Array<string>}
   */
  #typingTextList;

  constructor() {
    const timerArea = $('#timer');
    this.#timer = new Timer(timerArea);
    this.#typingTextList = [
      "これはダミーの文字列です。",
      "<script>悪意のある文字列</script>",
      // "これは長い文章のテストです。これは長い文章のテストです。これは長い文章のテストです。これは長い文章のテストです。これは長い文章のテストです。これは長い文章のテストです。"
    ];
    /*
    $.get('/typing-test/api/get-text').then(
      object => {
        this.#typingTextList = object.textList;
      },
      error => {
        console.error('文章の取得に失敗しました');
      }
    );
    */
    this.reset();
  }
  /**
   * 開始処理
   */
  start() {
    this.#isInTest = true;
    this.#curTypingTextIndex = 0;
    this.#timer.start();
    messageArea.text('Esc でリセット');
    curTypingTextArea.text(this.curTypingText);
    typingInputArea.val('');
    typingInputArea.trigger('focus');
    nextTypingTextArea.text(this.displayNextTypingText);
    resultArea.hide();
    resultBodyArea.text('');
    outputArea.text('');
    sendRecordToRankingButtonArea.hide();
    sendRecordToRankingButtonArea.prop('disabled', false);
    sendRecordToRankingButtonArea.text('ネットランキングに記録を送信');
    resultButtonsArea.hide();
  }
  /**
   * リセット処理
   */
  reset() {
    this.#isInTest = false;
    this.#curTypingTextIndex = -1;
    this.#timer.reset();
    messageArea.text('Enter または Space を押してスタート');
    curTypingTextArea.text(this.curTypingText);
    typingInputArea.val('');
    nextTypingTextArea.text(this.displayNextTypingText);
    resultArea.hide();
    resultBodyArea.text('');
    outputArea.text('');
    sendRecordToRankingButtonArea.hide();
    sendRecordToRankingButtonArea.prop('disabled', false);
    sendRecordToRankingButtonArea.text('ネットランキングに記録を送信');
    resultButtonsArea.hide();
  }
  /**
   * 入力文字列が確定されたときの処理
   * @param {string} inputText 入力された文字列
   */
  input(inputText) {
    assert.defined(inputText);

    // 入力された文字列と curTypingText の差分を表示
    curTypingTextArea.html(this.getTextDiffStringIncludesSpanTag(inputText));

    const isCorrectInput = (inputText === this.#typingTextList[this.#curTypingTextIndex]);
    if (isCorrectInput) {
      // 入力文字列が正しい場合
      typingInputArea.val('');
      ++this.#curTypingTextIndex;
      const isFinished = (this.#curTypingTextIndex === this.#typingTextList.length);
      if (isFinished) {
        this.finish();
        return;
      }
      // テキストを更新
      curTypingTextArea.text(this.curTypingText);
      nextTypingTextArea.text(this.displayNextTypingText);
    }
  }
  /**
   * curTypingText のうち、入力された文字列と一致
   * する文字を灰色に、異なる文字を赤色にする span
   * タグを付けた文字列を返す（未入力の文字はタグなし）
   * @param {string} inputText 入力された文字列
   * @return {string} curTypingText に span タグを付与したもの
   */
  getTextDiffStringIncludesSpanTag(inputText) {
    assert.defined(inputText);

    const curTypingText = this.#typingTextList[this.#curTypingTextIndex];
    const lastIndex = Math.min(inputText.length, curTypingText.length);
    let res = "";

    for (let i = 0; i < lastIndex; ++i) {
      if (inputText[i] === curTypingText[i]) {
        // 一致する（入力済み）なら灰色
        res += `<span style="color:#cccccc;">${utils.escapeText(curTypingText[i])}</span>`
      }
      else {
        // 一致しない（誤り）なら赤色（下線付き）
        res += `<span class="border-bottom border-secondary" style="color:red">${utils.escapeText(curTypingText[i])}</span>`
      }
    }
    // 未入力なら黒色
    res += utils.escapeText(curTypingText.substring(lastIndex));

    return res;
  }
  /**
   * 打ち終わったときの処理
   */
  finish() {
    this.#isInTest = false;
    assert.defined(this.#timer);
    this.#timer.stop();

    const resultTimeMs = this.#timer.elapsedTimeMs;

    // 結果を記録する
    const resultObject = {
      'timeMs': resultTimeMs,
      '_csrf': csrfTokenArea.val()
    };
    $.post('/typing-test/api/record', resultObject, 'json').then(
      object => {
        assert.defined(object.status, object.recordRank, object.canUpdateRanking);
        const recordRank = parseInt(object.recordRank);
        const canUpdateRanking = object.canUpdateRanking;

        // 結果の表示
        const displayTime = (resultTimeMs / 1000).toFixed(3);
        const displayMessage =
          recordRank === 1
            ? `新記録達成！`
            : `第${recordRank}位`;
        // WARNING: エスケープされていない文字列を入れないこと！！！
        resultBodyArea.html(
          `Time: ${utils.escapeText(displayTime)}<br>${utils.escapeText(displayMessage)}`
        );

        resultArea.show();
        resultButtonsArea.show();

        if (canUpdateRanking) {
          sendRecordToRankingButtonArea.show();
        }
      },
      error => {
        outputArea.text('記録の保存に失敗しました');
      }
    );
  }
  /**
   * タイピングテスト中か否か
   * @type {boolean}
   */
  get isInTest() {
    return this.#isInTest;
  }
  /**
   * タイム (ms)
   *
   * タイムが取得できない場合、-1
   * @type {number}
   */
  get resultTimeMs() {
    if (this.#isInTest || this.#timer.elapsedTimeMs === 0) return -1;
    return this.#timer.elapsedTimeMs;
  }
  /**
   * 現在の文字列
   *
   * 現在の文字列が存在しない場合（開始前を含む）、空文字列を返す
   * @type {string}
   */
  get curTypingText() {
    const curIndex = this.#curTypingTextIndex;
    const list = this.#typingTextList;
    if (curIndex < 0 || curIndex >= list.length) return '';
    else return list[curIndex];
  }
  /**
   * 次の文字列
   *
   * 次の文字列が存在しない場合、空文字列を返す
   * @type {string}
   */
  get nextTypingText() {
    const nextIndex = this.#curTypingTextIndex + 1;
    const list = this.#typingTextList;
    if (nextIndex < 0 || nextIndex >= list.length) return '';
    else return list[nextIndex];
  }
  /**
   * 次の文字列の先頭 30 文字に 'NEXT: ' という prefix を付けたもの
   *
   * 次の文字列が 30 文字より長い場合、 '...' という suffix を付ける
   * @type {string}
   */
  get displayNextTypingText() {
    const text = this.nextTypingText;
    const len = 30;
    const textSubstr = text.substring(0, len);
    const suffix = text.length <= len ? '' : '...';
    return `NEXT: ${textSubstr}${suffix}`;
  }
}

const typingTest = new TypingTest();

// タイピングテストの開始・リセット用
$(document.body).on('keydown', event => {
  const startKeyList = ['Enter', ' '];
  const resetKeyList = ['Escape'];
  if (!typingTest.isInTest && startKeyList.includes(event.key)) {
    typingTest.start();
  }
  else if (resetKeyList.includes(event.key)) {
    // Vimmium を使っていると、typingInputArea にフォーカスがあるときに Esc が検出されない
    typingTest.reset();
  }
});

// タイピングテスト中、入力した文字列の確定用
/*
typingInputArea.on('keypress', event => {
  if (typingTest.isInTest && event.key === 'Enter') {
    const inputText = typingInputArea.val();
    typingTest.input(inputText);
  }
});
*/
typingInputArea.on('change', event => {
  if (typingTest.isInTest) {
    const inputText = typingInputArea.val();
    typingTest.input(inputText);
  }
});

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

// 「ネットランキングに記録を送信」ボタン
sendRecordToRankingButtonArea.on('click', () => {
  // ボタンを無効化
  sendRecordToRankingButtonArea.prop('disabled', true);

  const resultTimeMs = typingTest.resultTimeMs;
  if (resultTimeMs <= 0) {
    outputArea.text('記録を送信できませんでした');
    return;
  }

  // 記録を送信する
  const resultObject = {
    'timeMs': resultTimeMs,
    '_csrf': csrfTokenArea.val()
  };
  $.post('/typing-test/api/ranking', resultObject, 'json').then(
    object => {
      assert.defined(object.status, object.rankingRank);
      showModal('記録を送信しました', `あなたの記録は ${object.rankingRank} 位です`);
      sendRecordToRankingButtonArea.text('記録を送信しました');
    },
    error => {
      outputArea.text('記録を送信できませんでした');
    }
  );
});

// 「リトライ」ボタン
retryButtonArea.on('click', () => {
  typingTest.reset();
});

// コピー禁止
$(document.body).on('copy', e => { e.preventDefault(); });
// ペースト禁止
typingInputArea.on('paste', e => { e.preventDefault(); });