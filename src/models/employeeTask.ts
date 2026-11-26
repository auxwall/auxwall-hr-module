import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const employeeTask = (sequelize: Sequelize) => sequelize.define(hrCommonNames.employeeTask.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  phase: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  assignedTo: { type: DataTypes.INTEGER, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'phase'] }, { fields: ['companyId', 'status', 'dueDate'] }] });