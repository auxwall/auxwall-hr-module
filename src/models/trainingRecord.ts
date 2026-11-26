import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const trainingRecord = (sequelize: Sequelize) => sequelize.define(hrCommonNames.trainingRecord.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  courseName: { type: DataTypes.STRING, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: true },
  assignedDate: { type: DataTypes.DATEONLY, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  completedDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'assigned' },
  certificateKey: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'status'] }] });