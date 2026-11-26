import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const leaveRequest = (sequelize: Sequelize) => sequelize.define(hrCommonNames.leaveRequest.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  leaveTypeId: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  requestedDays: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  attachmentKey: { type: DataTypes.STRING, allowNull: true },
  reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewNotes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'startDate'] }, { fields: ['companyId', 'status'] }] });