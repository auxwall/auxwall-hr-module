import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const staffSchedule = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.staffSchedule.name, {
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // Week, Month
    data: { type: DataTypes.JSON, allowNull: false },
    companyId: { type: DataTypes.INTEGER, allowNull: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true }
  });
};
