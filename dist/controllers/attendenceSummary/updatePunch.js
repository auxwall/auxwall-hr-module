"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../../index");
const attendenceLogic_1 = require("../../utils/attendenceLogic");
const updatePunch = async (id, date, updatedPunches) => {
    const AttendenceSummary = index_1.models.attendenceSummary;
    // Optimize: only retrieve the staffId attribute
    const summary = await AttendenceSummary.findByPk(id, { attributes: ["staffId"] });
    if (!summary) {
        throw new Error("Attendance not found");
    }
    const staffId = summary.get("staffId");
    const sequelize = AttendenceSummary.sequelize;
    const Punching = index_1.models.punching || sequelize.models["attendance_transaction"];
    if (!Punching) {
        throw new Error("Punching model (attendance_transaction) not found in database.");
    }
    const startOfDay = (0, moment_1.default)(date).startOf("day").toDate();
    const endOfDay = (0, moment_1.default)(date).endOf("day").toDate();
    // Prep new punches
    const newPunches = updatedPunches
        .map(p => ({ staffId, eventDate: (0, moment_1.default)(p.eventDate, "YYYY-MM-DD HH:mm", true) }))
        .filter(p => p.eventDate.isValid())
        .map(p => ({ staffId: p.staffId, eventDate: p.eventDate.toDate() }));
    // Optimize: Wrap database writes in a transaction for atomicity and consistency
    const { insertedCount, deletedCount } = await sequelize.transaction(async (t) => {
        // 1. GET OLD PUNCHES (keep IDs)
        const oldPunches = await Punching.findAll({
            where: { staffId, eventDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } },
            attributes: ["id"],
            transaction: t
        });
        const oldIds = oldPunches.map((p) => p.id);
        // 2. INSERT NEW FIRST
        const inserted = await Punching.bulkCreate(newPunches, { transaction: t });
        // 3. DELETE ONLY OLD ONES BY ID
        if (oldIds.length > 0) {
            await Punching.destroy({ where: { id: { [sequelize_1.Op.in]: oldIds } }, transaction: t });
        }
        return { insertedCount: inserted.length, deletedCount: oldIds.length };
    });
    // Optimize: Avoid redundant query. updateAttendanceSummary only extracts staffId & eventDate
    // from the punching record, and does its own DB queries.
    await (0, attendenceLogic_1.updateAttendanceSummary)([{ staffId, eventDate: date }], index_1.models);
    return { success: true, message: "Punch updated safely (old replaced)", inserted: insertedCount, deleted: deletedCount };
};
exports.default = updatePunch;
