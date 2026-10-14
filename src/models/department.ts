import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const department = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.department.name, {
    name: { type: DataTypes.TEXT, allowNull: false },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true }
  });
};
