import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const performanceReview = (sequelize: Sequelize) => sequelize.define(hrCommonNames.performanceReview.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true },
  periodStart: { type: DataTypes.DATEONLY, allowNull: false },
  periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
  goals: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  rating: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
  employeeComments: { type: DataTypes.TEXT, allowNull: true },
  managerFeedback: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'periodEnd'] }] });