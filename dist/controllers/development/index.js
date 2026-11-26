"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePerformanceReview = exports.savePerformanceReview = exports.getPerformanceReviews = exports.deleteTrainingRecord = exports.saveTrainingRecord = exports.getTrainingRecords = void 0;
const index_1 = require("../../index");
const hrShared_1 = require("../hrShared");
async function getTrainingRecords(companyId, options = {}) {
    return index_1.models.trainingRecord.findAll({
        where: {
            companyId,
            ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
            ...(options.status ? { status: options.status } : {}),
        },
        order: [
            ['dueDate', 'ASC'],
            ['id', 'DESC'],
        ],
    });
}
exports.getTrainingRecords = getTrainingRecords;
async function saveTrainingRecord(data) {
    var _a;
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    if (!((_a = data.courseName) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new Error('Course name is required');
    }
    const Record = index_1.models.trainingRecord;
    const fields = [
        'courseName',
        'provider',
        'assignedDate',
        'dueDate',
        'completedDate',
        'status',
        'certificateKey',
        'notes',
    ];
    const values = { updatedBy: data.userId };
    for (const key of fields) {
        if (data[key] !== undefined) {
            values[key] = data[key];
        }
    }
    if (data.id) {
        const row = await Record.findOne({
            where: { id: Number(data.id), companyId },
        });
        if (!row) {
            throw new Error('Training record not found');
        }
        await row.update(values);
        return row;
    }
    return Record.create({
        ...values,
        companyId,
        staffId,
        createdBy: data.userId,
    });
}
exports.saveTrainingRecord = saveTrainingRecord;
async function deleteTrainingRecord(companyId, id) {
    const count = await index_1.models.trainingRecord.destroy({ where: { companyId, id } });
    if (!count) {
        throw new Error('Training record not found');
    }
    return true;
}
exports.deleteTrainingRecord = deleteTrainingRecord;
async function getPerformanceReviews(companyId, options = {}) {
    return index_1.models.performanceReview.findAll({
        where: {
            companyId,
            ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
            ...(options.status ? { status: options.status } : {}),
        },
        order: [['periodEnd', 'DESC']],
    });
}
exports.getPerformanceReviews = getPerformanceReviews;
async function savePerformanceReview(data) {
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    if (!data.periodStart ||
        !data.periodEnd ||
        data.periodEnd < data.periodStart) {
        throw new Error('A valid review period is required');
    }
    if (data.rating !== undefined &&
        data.rating !== null &&
        (Number(data.rating) < 0 || Number(data.rating) > 5)) {
        throw new Error('Rating must be between 0 and 5');
    }
    const Review = index_1.models.performanceReview;
    const fields = [
        'reviewerId',
        'periodStart',
        'periodEnd',
        'goals',
        'rating',
        'employeeComments',
        'managerFeedback',
        'status',
    ];
    const values = { updatedBy: data.userId };
    for (const key of fields) {
        if (data[key] !== undefined) {
            values[key] = data[key];
        }
    }
    if (values.status === 'completed') {
        values.completedAt = new Date();
    }
    if (data.id) {
        const row = await Review.findOne({
            where: { id: Number(data.id), companyId },
        });
        if (!row) {
            throw new Error('Performance review not found');
        }
        await row.update(values);
        return row;
    }
    return Review.create({
        ...values,
        companyId,
        staffId,
        createdBy: data.userId,
    });
}
exports.savePerformanceReview = savePerformanceReview;
async function deletePerformanceReview(companyId, id) {
    const count = await index_1.models.performanceReview.destroy({ where: { companyId, id } });
    if (!count) {
        throw new Error('Performance review not found');
    }
    return true;
}
exports.deletePerformanceReview = deletePerformanceReview;
