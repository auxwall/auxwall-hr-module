import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const employeeHistory = (sequelize: Sequelize) => sequelize.define(hrCommonNames.employeeHistory.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  eventType: { type: DataTypes.STRING, allowNull: false },
  changes: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  note: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'createdAt'] }] });