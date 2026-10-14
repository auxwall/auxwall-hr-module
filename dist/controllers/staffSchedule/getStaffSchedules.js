"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const getStaffSchedules = async (companyId, options = {}) => {
    const StaffSchedule = index_1.models.staffSchedule;
    const Department = index_1.models.department;
    const where = { companyId };
    if (options.type) {
        where.type = options.type;
    }
    if (options.departmentId) {
        where.departmentId = options.departmentId;
    }
    const queryOptions = { where, include: [{ model: Department, as: "department", attributes: ["id", "name"] }] };
    const isPaginated = options.limit !== undefined && options.offset !== undefined;
    if (isPaginated) {
        queryOptions.limit = options.limit;
        queryOptions.offset = options.offset;
    }
    // Fetch schedules
    const result = isPaginated ? await StaffSchedule.findAndCountAll(queryOptions) : await StaffSchedule.findAll(queryOptions);
    const schedules = isPaginated ? result.rows : result;
    // Safely fetch shifts if StaffShift model is defined in the models proxy
    let allShifts = [];
    const StaffShift = index_1.models.staffShift;
    if (StaffShift) {
        allShifts = await StaffShift.findAll({ where: { companyId }, attributes: ["id", "shiftName"] });
    }
    // Map shift IDs to shift names (with fallback to the shift ID if shift is not found)
    const mappedRows = schedules.map((s) => {
        var _a;
        const dataObj = s.get('data') || {};
        const existingData = typeof dataObj === 'string' ? JSON.parse(dataObj) : dataObj;
        const mappedData = {};
        for (const [day, shiftId] of Object.entries(existingData)) {
            const shift = allShifts.find(sh => sh.id === shiftId);
            mappedData[day] = shift ? shift.shiftName : shiftId;
        }
        return { id: s.get('id'), type: s.get('type'), name: s.get('name'), companyId: s.get('companyId'), departmentId: s.get('departmentId'), departmentName: (_a = s.get('department')) === null || _a === void 0 ? void 0 : _a.name, data: mappedData, createdAt: s.get('createdAt'), updatedAt: s.get('updatedAt') };
    });
    if (isPaginated) {
        return { count: result.count, rows: mappedRows };
    }
    return mappedRows;
};
exports.default = getStaffSchedules;
