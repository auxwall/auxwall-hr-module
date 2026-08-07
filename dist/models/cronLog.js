"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    const CronLog = sequelize.define('cron_log', {
        jobName: {
            type: sequelize_1.DataTypes.STRING,
            primaryKey: true
        },
        lastRunDate: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false
        }
    });
    return CronLog;
};
