import { DataTypes } from "sequelize";

export default (sequelize: any) => {
    const CronLog = sequelize.define('cron_log', {
        jobName: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        lastRunDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    });

    return CronLog;
};
