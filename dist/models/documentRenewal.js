"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRenewal = void 0;
const sequelize_1 = require("sequelize");
const commonName_1 = __importDefault(require("../config/commonName"));
const documentRenewal = (sequelize) => {
    return sequelize.define(commonName_1.default.documentRenewal.name, {
        documentId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        documentNumber: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
        issueDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
        expiryDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
        fileURL: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true }
    });
};
exports.documentRenewal = documentRenewal;
