'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Ranking = loader.database.define(
  'rankings',
  {
    time: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false
  }
);

module.exports = Ranking;