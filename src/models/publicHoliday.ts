import { DataTypes, Sequelize } from 'sequelize';
import hrCommonNames from '../config/commonName';

export const publicHoliday = (sequelize: Sequelize) => sequelize.define(hrCommonNames.publicHoliday.name, {
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  holidayDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  appliesTo: { type: DataTypes.STRING, allowNull: false, defaultValue: 'all' },
  isRecurring: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'holidayDate'] }, { unique: true, fields: ['companyId', 'name', 'holidayDate'] }] });