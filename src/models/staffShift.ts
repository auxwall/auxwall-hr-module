import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const staffShift = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.staffShift.name, {
    uploadedBy: { type: DataTypes.INTEGER, allowNull: true },
    shiftName: { type: DataTypes.STRING, allowNull: false },
    shiftColor: { type: DataTypes.STRING, allowNull: true },
    shiftStart: { type: DataTypes.TIME, allowNull: false },
    shiftEnd: { type: DataTypes.TIME, allowNull: false },
    breakMinutes: { type: DataTypes.INTEGER, allowNull: true },
    lateGraceMinutes: { type: DataTypes.INTEGER, allowNull: true },
    overtimeMinutes: { type: DataTypes.INTEGER, allowNull: true },
    companyId: { type: DataTypes.INTEGER, allowNull: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: true }
  });
};
