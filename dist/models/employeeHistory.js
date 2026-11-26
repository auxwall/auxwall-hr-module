"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeHistory = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const employeeHistory = (sequelize) => sequelize.define(commonName_1.default.employeeHistory.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    eventType: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    changes: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: {} },
    note: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'createdAt'] }] });
exports.employeeHistory = employeeHistory;
