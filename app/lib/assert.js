"use strict";

export default class assert {
  static eq(actual, expected, message) {
    console.assert(
      actual === expected,
      "\nact: " +
        actual +
        "\nexp: " +
        expected +
        (typeof message === "undefined" ? "" : "\n" + message)
    );
  }
  static defined(...args) {
    args.forEach((value) => {
      console.assert(typeof value != "undefined", "value is undefined");
    });
  }
  static shouldNotReach() {
    console.assert(false, "メッセージはでないはずだよ");
  }
}

