import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const document = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.document.name, {
    staffId: { type: DataTypes.INTEGER, allowNull: true },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    documentTypeId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.TEXT, defaultValue: 'Active' }
  });
};
