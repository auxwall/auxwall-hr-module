import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const finalSettlement = (sequelize: Sequelize) => sequelize.define(hrCommonNames.finalSettlement.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  calculationDate: { type: DataTypes.DATEONLY, allowNull: false },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: false },
  lastWorkingDate: { type: DataTypes.DATEONLY, allowNull: false },
  lastBasicWage: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  unpaidAbsenceDays: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
  serviceDays: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  gratuityDays: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  gratuityAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  leaveEncashmentAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  otherAdditions: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  deductions: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  netSettlementEstimate: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  calculationBreakdown: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'status'] }] });