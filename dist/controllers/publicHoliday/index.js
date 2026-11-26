"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePublicHoliday = exports.savePublicHoliday = exports.getPublicHolidays = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
async function getPublicHolidays(companyId, year) {
    const where = { companyId };
    if (year)
        where.holidayDate = { [sequelize_1.Op.lte]: `${year}-12-31` };
    return index_1.models.publicHoliday.findAll({ where, order: [['holidayDate', 'ASC']] });
}
exports.getPublicHolidays = getPublicHolidays;
async function savePublicHoliday(data) {
    var _a;
    if (!((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim()) || !data.holidayDate)
        throw new Error('Holiday name and date are required');
    if (data.endDate && data.endDate < data.holidayDate)
        throw new Error('End date cannot be before start date');
    const Holiday = index_1.models.publicHoliday;
    const fields = ['name', 'holidayDate', 'endDate', 'appliesTo', 'isRecurring', 'notes'];
    const values = { updatedBy: data.userId };
    for (const key of fields)
        if (data[key] !== undefined)
            values[key] = data[key];
    if (values.name)
        values.name = values.name.trim();
    if (!values.appliesTo)
        values.appliesTo = 'all';
    if (data.id) {
        const row = await Holiday.findOne({ where: { id: Number(data.id), companyId: Number(data.companyId) } });
        if (!row)
            throw new Error('Public holiday not found');
        await row.update(values);
        return row;
    }
    return Holiday.create({ ...values, companyId: Number(data.companyId), createdBy: data.userId });
}
exports.savePublicHoliday = savePublicHoliday;
async function deletePublicHoliday(companyId, id) {
    const count = await index_1.models.publicHoliday.destroy({ where: { companyId, id } });
    if (!count)
        throw new Error('Public holiday not found');
    return true;
}
exports.deletePublicHoliday = deletePublicHoliday;
