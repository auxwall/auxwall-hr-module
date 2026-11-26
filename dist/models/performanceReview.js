"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceReview = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const performanceReview = (sequelize) => sequelize.define(commonName_1.default.performanceReview.name, {
    companyId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    periodStart: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    periodEnd: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    goals: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
    rating: { type: sequelize_1.DataTypes.DECIMAL(4, 2), allowNull: true },
    employeeComments: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    managerFeedback: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
}, { indexes: [{ fields: ['companyId', 'staffId', 'periodEnd'] }] });
exports.performanceReview = performanceReview;
