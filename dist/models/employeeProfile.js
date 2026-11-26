"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeProfile = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const employeeProfile = (sequelize) => sequelize.define(commonName_1.default.employeeProfile.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    employeeNo: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    managerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    employmentType: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'full-time' },
    workerCategory: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'expatriate' },
    endOfServiceScheme: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'standard' },
    workLocation: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    lifecycleStatus: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    contractStartDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    contractEndDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    probationEndDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    lastWorkingDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    emergencyContactName: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    emergencyContactPhone: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    emergencyContacts: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ unique: true, fields: ['companyId', 'staffId'] }, { unique: true, fields: ['companyId', 'employeeNo'] }] });
exports.employeeProfile = employeeProfile;
