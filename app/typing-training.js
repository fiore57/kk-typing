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
const retryButtonArea = $('#retryButton');

class TypingTraining {
  /**
   * タイピングトレーニング中かどうか
   * @type {boolean}
   */
  #isInTraining = false;
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

  constructor(typingTextList) {
    assert.defined(typingTextList);
    const timerArea = $('#timer');
    this.#timer = new Timer(timerArea);
    this.#typingTextList = typingTextList;
    this.reset();
  }
  /**
   * 開始処理
   */
  start() {
    this.reset();
    this.#isInTraining = true;
    this.#curTypingTextIndex = 0;
    this.#timer.start();
    messageArea.text('Esc でリセット');
    curTypingTextArea.text(this.curTypingText);
    nextTypingTextArea.text(this.displayNextTypingText);
    typingInputArea.trigger('focus');
  }
  /**
   * リセット処理
   */
  reset() {
    this.#isInTraining = false;
    this.#curTypingTextIndex = -1;
    this.#timer.reset();
    messageArea.text('Enter を押してスタート');
    curTypingTextArea.text(this.curTypingText);
    typingInputArea.val('');
    nextTypingTextArea.text(this.displayNextTypingText);
    resultArea.hide();
    resultBodyArea.text('');
    outputArea.text('');
    resultButtonsArea.hide();
  }
  /**
   * 入力文字列が確定されたときの処理
   * @param {string} inputText 入力された文字列
   */
  input(inputText) {
    assert.defined(inputText);

    // 入力された文字列と curTypingText の差分を表示
    // WARNING: エスケープされていない文字列を入れないこと！！！
    curTypingTextArea.html(this.getTextDiffStringIncludesSpanTag(inputText));

    const isCorrectInput = (inputText === this.curTypingText);
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

    const curTypingText = this.curTypingText;
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
    this.#isInTraining = false;
    assert.defined(this.#timer);
    this.#timer.stop();

    const resultTimeMs = this.#timer.elapsedTimeMs;

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
    const charCount = this.#typingTextList.reduce(((acc, cur) => acc + cur.length), 0);
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
    // WARNING: エスケープされていない文字列を入れないこと！！！
    resultBodyArea.html(
      `Time: ${utils.escapeText(displayTime)} 秒<br>` +
      `${utils.escapeText(displayCharPerSecond)} 文字/秒<br>` +
      `${utils.escapeText(displayCharPerMinute)} 文字/分`
    );

    resultArea.show();
    resultButtonsArea.show();
  }
  /**
   * タイピングトレーニング中か否か
   * @type {boolean}
   */
  get isInTraining() {
    return this.#isInTraining;
  }
  /**
   * タイム (ms)
   *
   * タイムが取得できない場合、-1
   * @type {number}
   */
  get resultTimeMs() {
    if (this.#isInTraining || this.#timer.elapsedTimeMs === 0) return -1;
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

let typingTraining;

const inputFileArea = $('#inputFile');
// 「ファイルを選択」ボタン
inputFileArea.on('change', event => {
  const files = event.target.files;
  // ファイルが選択されていない場合
  if (files.length === 0) {
    if (typingTraining) {
      // typingTraining !== undefined ならば reset
      typingTraining.reset();
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    // 読み込んだファイルのテキストを typingTextList にセット
    const typingText = event.target.result;
    const typingTextList = typingText.split('\n');
    const formattedTypingTextList = typingTextList.map(text => text.trim()).filter(text => text !== '');
    typingTraining = new TypingTraining(formattedTypingTextList);
    initialize();
  };

  const file = files[0];
  try {
    reader.readAsText(file);
  }
  catch (error) {
    outputArea.text('ファイルの読み込みに失敗しました');
  }
});

/**
 * typingTextList の取得が終わってから実行する処理
 */
function initialize() {
  // タイピングテストの開始・リセット用
  $(document.body).on('keydown', event => {
    const startKeyList = ['Enter'];
    const resetKeyList = ['Escape'];
    if (!typingTraining.isInTraining && startKeyList.includes(event.key)) {
      typingTraining.start();
    }
    else if (resetKeyList.includes(event.key)) {
      // Vimmium を使っていると、typingInputArea にフォーカスがあるときに Esc が検出されない
      typingTraining.reset();
    }
  });

  // タイピングテスト中、入力した文字列の確定用
  typingInputArea.on('change', () => {
    if (typingTraining.isInTraining) {
      const inputText = typingInputArea.val();
      typingTraining.input(inputText);
    }
  });

  // 「リトライ」ボタン
  retryButtonArea.on('click', () => {
    typingTraining.reset();
  });
}

// コピー禁止
$(document.body).on('copy', e => { e.preventDefault(); });
// ペースト禁止
typingInputArea.on('paste', e => { e.preventDefault(); });