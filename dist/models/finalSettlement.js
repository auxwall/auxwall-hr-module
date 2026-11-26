"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalSettlement = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const finalSettlement = (sequelize) => sequelize.define(commonName_1.default.finalSettlement.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    calculationDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    joiningDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    lastWorkingDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    lastBasicWage: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false },
    unpaidAbsenceDays: { type: sequelize_1.DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    serviceDays: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    gratuityDays: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    gratuityAmount: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false },
    leaveEncashmentAmount: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    otherAdditions: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    deductions: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    netSettlementEstimate: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false },
    calculationBreakdown: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    reviewedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    approvedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'status'] }] });
exports.finalSettlement = finalSettlement;
