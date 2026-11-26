"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveType = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const leaveType = (sequelize) => sequelize.define(commonName_1.default.leaveType.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    annualEntitlementDays: { type: sequelize_1.DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
    carryoverLimitDays: { type: sequelize_1.DataTypes.DECIMAL(7, 2), allowNull: false, defaultValue: 0 },
    weeklyOffDays: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [0, 6] },
    isPaid: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    requiresDocument: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ unique: true, fields: ['companyId', 'name'] }] });
exports.leaveType = leaveType;
