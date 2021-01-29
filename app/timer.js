'use strict';
import assert from './lib/assert';

export default class Timer {
  /**
   * タイマーが動いているかどうか
   * @type {boolean}
   */
  #isRunningTimer = false;
  /**
   * 計測開始時間
   * @type {number}
   */
  #startTimeMs;
  /**
   * 経過時間
   * @type {number}
   */
  #elapsedTimeMs = 0;
  /**
   * タイマーの描画先
   * @type {jQuery}
   */
  #timerArea;
  /**
   * @param {jQuery} timerArea タイマーの描画先
   */
  constructor(timerArea) {
    assert.defined(timerArea);
    this.#timerArea = timerArea;
    this.reset();
  }
  /**
   * 計測を開始する
   */
  start() {
    this.#isRunningTimer = true;
    this.#startTimeMs = Date.now();
    this.#elapsedTimeMs = 0;
    window.requestAnimationFrame(this.updateTime);
  }
  /**
   * タイマーを止める（タイムは保持する）
   */
  stop() {
    this.#isRunningTimer = false;
    this.#elapsedTimeMs = Date.now() - this.#startTimeMs;
    this.drawTime();
  }
  /**
   * タイマーをリセットする（タイムは破棄する）
   */
  reset() {
    this.#isRunningTimer = false;
    this.#elapsedTimeMs = 0;
    this.drawTime();
  }
  /**
   * requestAnimationFrame のループで呼ばれる関数
   *
   * 現在の経過時間を計算し、描画する
   */
  updateTime = () => {
    if (this.#isRunningTimer) {
      this.#elapsedTimeMs = Date.now() - this.#startTimeMs;
      this.drawTime();
      window.requestAnimationFrame(this.updateTime);
    }
  }
  /**
   * 現在の経過時間を描画する
   *
   * 値は小数第1位まで表示する
   */
  drawTime() {
    this.#timerArea.text(this.displayTime);
  }
  /**
   * 現在の経過時間 (ms)
   * @type {number}
   */
  get elapsedTimeMs() {
    return this.#elapsedTimeMs;
  }
  /**
   * 表示する時間を小数（文字列）で返す
   *
   * 値は小数第1位まで表示する
   * @return {string} 経過時間(s)
   */
  get displayTime() {
    return (this.elapsedTimeMs / 1000).toFixed(1);
  }
}