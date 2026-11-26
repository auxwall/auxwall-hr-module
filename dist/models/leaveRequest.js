"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRequest = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const leaveRequest = (sequelize) => sequelize.define(commonName_1.default.leaveRequest.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    leaveTypeId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    startDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    endDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    requestedDays: { type: sequelize_1.DataTypes.DECIMAL(7, 2), allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    reason: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    attachmentKey: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    reviewedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    reviewedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    reviewNotes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'startDate'] }, { fields: ['companyId', 'status'] }] });
exports.leaveRequest = leaveRequest;
