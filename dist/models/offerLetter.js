"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.offerLetter = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const offerLetter = (sequelize) => {
    return sequelize.define(commonName_1.default.offerLetter.name, {
        companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        candidateName: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        designation: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        startDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
        probation: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 6 },
        duration: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 2 },
        basic: { type: sequelize_1.DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        housing: { type: sequelize_1.DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        transport: { type: sequelize_1.DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        allowances: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        annualLeave: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 30 },
        status: { type: sequelize_1.DataTypes.TEXT, defaultValue: 'Draft' },
        passportNumber: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        refNo: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        nationality: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        noticePeriod: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        workingHours: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        signatoryName: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        signatoryTitle: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    });
};
exports.offerLetter = offerLetter;
