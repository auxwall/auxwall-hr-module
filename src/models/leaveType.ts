import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const leaveType = (sequelize: Sequelize) => sequelize.define(hrCommonNames.leaveType.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  annualEntitlementDays: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
  carryoverLimitDays: { type: DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
  weeklyOffDays: { type: DataTypes.JSONB, allowNull: false, defaultValue: [0, 6] },
  isPaid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  requiresDocument: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ unique: true, fields: ['companyId', 'name'] }] });