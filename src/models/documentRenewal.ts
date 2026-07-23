import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const documentRenewal = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.documentRenewal.name, {
    documentId: { type: DataTypes.INTEGER, allowNull: false },
    documentNumber: { type: DataTypes.TEXT, allowNull: false },
    issueDate: { type: DataTypes.DATEONLY, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    fileURL: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true }
  });
};
