import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const attendenceSummary = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.attendenceSummary.name, {
    staffId: { type: DataTypes.INTEGER, allowNull: true },
    staffName: { type: DataTypes.STRING, allowNull: true },
    attendenceDate: { type: DataTypes.DATEONLY, allowNull: true },
    shiftStart: { type: DataTypes.TIME, allowNull: true },
    shiftEnd: { type: DataTypes.TIME, allowNull: true },
    first_in: { type: DataTypes.TIME, allowNull: true },
    last_out: { type: DataTypes.TIME, allowNull: true },
    workedMinutes: { type: DataTypes.INTEGER, allowNull: true },
    lateMinutes: { type: DataTypes.INTEGER, allowNull: true },
    overtimeMinutes: { type: DataTypes.INTEGER, allowNull: true },
    breakMinutes: { type: DataTypes.INTEGER, allowNull: true },
    totalPunches: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING(), allowNull: true }, // "Present", "Late", "Absent", "Half Day", "Unauthorized", "Live"
    companyId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    indexes: [{ unique: true, fields: ['staffId', 'attendenceDate'] }]
  });
};
