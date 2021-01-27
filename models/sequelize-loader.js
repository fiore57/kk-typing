'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/kk_typing'
);

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};