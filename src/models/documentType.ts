import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const documentType = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.documentType.name, {
    name: { type: DataTypes.TEXT, allowNull: false },
    scope: { type: DataTypes.STRING },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.BOOLEAN, defaultValue: true }
  });
};
