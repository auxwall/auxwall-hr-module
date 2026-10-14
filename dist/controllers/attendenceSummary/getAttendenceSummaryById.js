"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../../index");
const getAttendenceSummaryById = async (id, date) => {
    const AttendenceSummary = index_1.models.attendenceSummary;
    const result = await AttendenceSummary.findByPk(id);
    if (!result) {
        throw new Error("Attendance not found");
    }
    const staffId = result.get("staffId");
    const sequelize = AttendenceSummary.sequelize;
    const Punching = index_1.models.punching || sequelize.models["attendance_transaction"];
    let rawPunches = [];
    if (Punching && staffId && date) {
        const startOfDay = (0, moment_1.default)(date).startOf("day").toDate();
        const endOfDay = (0, moment_1.default)(date).endOf("day").toDate();
        rawPunches = await Punching.findAll({ where: { staffId, eventDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } }, order: [["eventDate", "ASC"]] });
    }
    const attendance = {
        ...result.toJSON(),
        first_in: result.get("first_in") ? moment_1.default.utc(result.get("first_in"), "HH:mm:ss", true).local().format("HH:mm:ss") : null,
        last_out: result.get("last_out") ? moment_1.default.utc(result.get("last_out"), "HH:mm:ss", true).local().format("HH:mm:ss") : null
    };
    const formattedPunches = rawPunches.map(p => {
        const evDate = p.get ? p.get("eventDate") : p.eventDate;
        return { ...(p.toJSON ? p.toJSON() : p), eventDate: moment_1.default.utc(evDate).local().format("YYYY-MM-DD HH:mm:ss"), eventTime: moment_1.default.utc(evDate).local().format("HH:mm") };
    });
    const inPunches = [];
    const outPunches = [];
    formattedPunches.forEach((p, index) => {
        if (index % 2 === 0) {
            inPunches.push(p);
        }
        else {
            outPunches.push(p);
        }
    });
    return { attendance, punches: formattedPunches, inPunches, outPunches };
};
exports.default = getAttendenceSummaryById;
