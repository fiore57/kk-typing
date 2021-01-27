'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Record = loader.database.define(
  'records',
  {
    time: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['createdBy']
      }
    ]
  }
);

module.exports = Record;