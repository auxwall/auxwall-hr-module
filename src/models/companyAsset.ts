import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const companyAsset = (sequelize: Sequelize) =>
  sequelize.define(
    hrCommonNames.companyAsset.name,
    {
      companyId: { type: DataTypes.INTEGER, allowNull: false },
      staffId: { type: DataTypes.INTEGER, allowNull: false },
      assetName: { type: DataTypes.STRING, allowNull: false },
      assetCategory: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Other' },
      assetTag: { type: DataTypes.STRING, allowNull: true },
      serialNumber: { type: DataTypes.STRING, allowNull: true },
      assignedDate: { type: DataTypes.DATEONLY, allowNull: true },
      returnDate: { type: DataTypes.DATEONLY, allowNull: true },
      condition: { type: DataTypes.STRING, allowNull: false, defaultValue: 'good' },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'assigned' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      indexes: [
        { fields: ['companyId', 'staffId'] },
        { fields: ['companyId', 'status'] },
        { fields: ['companyId', 'assetCategory'] },
      ],
    },
  );

