'use strict';

export default class assert {
  /**
   * actual と expected が等しい
   * @param {*} actual
   * @param {*} expected
   * @param {string} message
   */
  static eq(actual, expected, message) {
    console.assert(
      actual === expected,
        '\nact: ' + actual +
        '\nexp: ' + expected +
        (typeof message === 'undefined' ? '' : '\n' + message)
    );
  }
  /**
   * args が全て undefined でない
   * @param  {...any} args
   */
  static defined(...args) {
    args.forEach((value) => {
      console.assert(typeof value != 'undefined', 'value is undefined');
    });
  }
  /**
   * 到達するはずがないコードである
   */
  static shouldNotReach() {
    console.assert(false, 'メッセージはでないはずだよ');
  }
}

