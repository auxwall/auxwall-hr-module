import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const assetCategory = (sequelize: Sequelize) =>
  sequelize.define(
    hrCommonNames.assetCategory.name,
    {
      companyId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      indexes: [
        { fields: ['companyId', 'name'], unique: true },
      ],
    },
  );

