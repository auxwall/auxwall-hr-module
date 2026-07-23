import { DataTypes, Sequelize } from "sequelize";
import hr_commonNames from "../config/commonName";

export const offerLetter = (sequelize: Sequelize) => {
  return sequelize.define(hr_commonNames.offerLetter.name, {
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    candidateName: { type: DataTypes.TEXT, allowNull: false },
    designation: { type: DataTypes.TEXT, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    probation: { type: DataTypes.INTEGER, defaultValue: 6 },
    duration: { type: DataTypes.INTEGER, defaultValue: 2 },
    basic: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    housing: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    transport: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    allowances: { type: DataTypes.TEXT, allowNull: true }, // JSON string containing all allowances
    annualLeave: { type: DataTypes.INTEGER, defaultValue: 30 },
    status: { type: DataTypes.TEXT, defaultValue: 'Draft' }, // Draft, Sent, Accepted, Rejected
    passportNumber: { type: DataTypes.TEXT, allowNull: true },
    refNo: { type: DataTypes.TEXT, allowNull: true },
    nationality: { type: DataTypes.TEXT, allowNull: true },
    noticePeriod: { type: DataTypes.TEXT, allowNull: true },
    workingHours: { type: DataTypes.TEXT, allowNull: true },
    signatoryName: { type: DataTypes.TEXT, allowNull: true },
    signatoryTitle: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true }
  });
};
