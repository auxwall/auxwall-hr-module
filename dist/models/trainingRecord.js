"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingRecord = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const trainingRecord = (sequelize) => sequelize.define(commonName_1.default.trainingRecord.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    courseName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    provider: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    assignedDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    dueDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    completedDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'assigned' },
    certificateKey: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'status'] }] });
exports.trainingRecord = trainingRecord;
