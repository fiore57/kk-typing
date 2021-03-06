# かな漢字タイピング

[![](https://github.com/fiore57/kk-typing/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/fiore57/kk-typing/actions)

[https://kk-typing.herokuapp.com](https://kk-typing.herokuapp.com)

かな漢字変換込みのタイピング練習ツール

## 概要

「かな漢字タイピング」は、かな漢字変換込みのタイピングを練習することができるアプリです。

インターネットランキングで、全国のライバルたちとタイピングの実力を競い合うことができます。

## 機能

タイピングテストを行うには、GitHub でのログインが必要です。

- トレーニング
  - 手元のテキストファイルの文章を入力する時間を計測します
  - お好みの文章で、かな漢字変換込みのタイピング練習ができます
- タイピングテスト
  - 日本国憲法前文を入力する時間を計測します
  - 記録はサーバーに保存されます
  - 記録をネットランキングに登録できます

## ライセンス

このソフトウェアは、MIT ライセンスのもとで公開されています。詳しくは [LICENSE](/LICENSE) を見てください。

## Project setup

```sh
yarn install
```

### Build

```sh
yarn build
```

### Start server

```sh
PORT=8000 yarn start
```

### Run tests

```sh
yarn test
```
