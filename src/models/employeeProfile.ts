import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const employeeProfile = (sequelize: Sequelize) => sequelize.define(hrCommonNames.employeeProfile.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  employeeNo: { type: DataTypes.STRING, allowNull: true },
  managerId: { type: DataTypes.INTEGER, allowNull: true },
  employmentType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'full-time' },
  workerCategory: { type: DataTypes.STRING, allowNull: false, defaultValue: 'expatriate' },
  endOfServiceScheme: { type: DataTypes.STRING, allowNull: false, defaultValue: 'standard' },
  workLocation: { type: DataTypes.STRING, allowNull: true },
  lifecycleStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
  contractStartDate: { type: DataTypes.DATEONLY, allowNull: true },
  contractEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  probationEndDate: { type: DataTypes.DATEONLY, allowNull: true },
  lastWorkingDate: { type: DataTypes.DATEONLY, allowNull: true },
  emergencyContactName: { type: DataTypes.STRING, allowNull: true },
  emergencyContactPhone: { type: DataTypes.STRING, allowNull: true },
  emergencyContacts: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ unique: true, fields: ['companyId', 'staffId'] }, { unique: true, fields: ['companyId', 'employeeNo'] }] });