"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFinalSettlementStatus = exports.createFinalSettlementEstimate = exports.getFinalSettlements = exports.calculateUaeFullTimeExpatriateGratuity = void 0;
const index_1 = require("../../index");
const hrShared_1 = require("../hrShared");
const roundMoney = (value) => Number(value.toFixed(2));
function calculateUaeFullTimeExpatriateGratuity(input) {
    const joining = new Date(`${input.joiningDate}T00:00:00Z`);
    const lastWorking = new Date(`${input.lastWorkingDate}T00:00:00Z`);
    if (!Number.isFinite(joining.getTime()) ||
        !Number.isFinite(lastWorking.getTime()) ||
        lastWorking < joining) {
        throw new Error('Valid joining and last working dates are required');
    }
    if (!Number.isFinite(input.lastBasicWage) || input.lastBasicWage <= 0) {
        throw new Error('Last basic wage must be greater than zero');
    }
    const grossServiceDays = Math.floor((lastWorking.getTime() - joining.getTime()) / 86400000) + 1;
    const unpaidAbsenceDays = Math.max(0, Number(input.unpaidAbsenceDays || 0));
    if (unpaidAbsenceDays > grossServiceDays) {
        throw new Error('Unpaid absence days cannot exceed the service period');
    }
    const serviceDays = grossServiceDays - unpaidAbsenceDays;
    const serviceYears = serviceDays / 365;
    const gratuityDays = serviceYears < 1
        ? 0
        : Math.min(21 * Math.min(serviceYears, 5) +
            30 * Math.max(serviceYears - 5, 0), 720);
    const gratuityAmount = roundMoney((input.lastBasicWage / 30) * gratuityDays);
    return {
        grossServiceDays,
        serviceDays: Number(serviceDays.toFixed(2)),
        serviceYears: Number(serviceYears.toFixed(6)),
        gratuityDays: Number(gratuityDays.toFixed(4)),
        gratuityAmount,
    };
}
exports.calculateUaeFullTimeExpatriateGratuity = calculateUaeFullTimeExpatriateGratuity;
async function getFinalSettlements(companyId, options = {}) {
    return index_1.models.finalSettlement.findAll({
        where: {
            companyId,
            ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
            ...(options.status ? { status: options.status } : {}),
        },
        order: [['createdAt', 'DESC']],
    });
}
exports.getFinalSettlements = getFinalSettlements;
async function createFinalSettlementEstimate(data) {
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    const staff = await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const profile = (await index_1.models.employeeProfile.findOne({ where: { companyId, staffId } }));
    const employmentType = (profile === null || profile === void 0 ? void 0 : profile.employmentType) || 'full-time';
    const workerCategory = (profile === null || profile === void 0 ? void 0 : profile.workerCategory) || 'expatriate';
    const endOfServiceScheme = (profile === null || profile === void 0 ? void 0 : profile.endOfServiceScheme) || 'standard';
    if (employmentType !== 'full-time') {
        throw new Error('Calculator supports full-time employees only');
    }
    if (workerCategory !== 'expatriate') {
        throw new Error('Calculator supports expatriate employees only; apply the relevant pension rules to other categories');
    }
    if (endOfServiceScheme !== 'standard') {
        throw new Error('Alternative end-of-service savings schemes are not covered by this calculator');
    }
    const joiningDate = data.joiningDate || staff.joinDate;
    const lastWorkingDate = data.lastWorkingDate || profile.lastWorkingDate;
    if (!joiningDate || !lastWorkingDate) {
        throw new Error('Joining date and last working date are required');
    }
    const lastBasicWage = Number(data.lastBasicWage);
    const unpaidAbsenceDays = Number(data.unpaidAbsenceDays || 0);
    const result = calculateUaeFullTimeExpatriateGratuity({
        joiningDate,
        lastWorkingDate,
        lastBasicWage,
        unpaidAbsenceDays,
    });
    const leaveEncashmentAmount = roundMoney(Number(data.leaveEncashmentAmount || 0));
    const otherAdditions = roundMoney(Number(data.otherAdditions || 0));
    const deductions = roundMoney(Number(data.deductions || 0));
    if ([leaveEncashmentAmount, otherAdditions, deductions].some(amount => !Number.isFinite(amount) || amount < 0)) {
        throw new Error('Settlement additions and deductions must be zero or greater');
    }
    const netSettlementEstimate = roundMoney(result.gratuityAmount +
        leaveEncashmentAmount +
        otherAdditions -
        deductions);
    const calculationBreakdown = {
        jurisdiction: 'UAE private sector',
        employeeCategory: 'expatriate full-time',
        endOfServiceScheme: 'standard gratuity',
        wageBasis: 'last basic wage',
        rule: '21 days per service year for the first five years; 30 days per additional service year; maximum 24 months basic wage; no entitlement before one year',
        ...result,
        lastBasicWage,
        leaveEncashmentAmount,
        otherAdditions,
        deductions,
        netSettlementEstimate,
        disclaimer: 'Estimate for HR review. Confirm current legal applicability, employee records, and deductions before approval.',
    };
    return index_1.models.finalSettlement.create({
        companyId,
        staffId,
        calculationDate: new Date().toISOString().slice(0, 10),
        joiningDate,
        lastWorkingDate,
        lastBasicWage,
        unpaidAbsenceDays,
        serviceDays: result.serviceDays,
        gratuityDays: result.gratuityDays,
        gratuityAmount: result.gratuityAmount,
        leaveEncashmentAmount,
        otherAdditions,
        deductions,
        netSettlementEstimate,
        calculationBreakdown,
        createdBy: data.userId,
    });
}
exports.createFinalSettlementEstimate = createFinalSettlementEstimate;
async function updateFinalSettlementStatus(companyId, id, status, userId, notes) {
    var _a;
    const row = (await index_1.models.finalSettlement.findOne({ where: { id, companyId } }));
    if (!row) {
        throw new Error('Final settlement not found');
    }
    const allowed = {
        draft: ['reviewed'],
        reviewed: ['approved', 'draft'],
        approved: ['closed'],
    };
    if (!((_a = allowed[row.status]) === null || _a === void 0 ? void 0 : _a.includes(status))) {
        throw new Error(`Cannot change settlement from ${row.status} to ${status}`);
    }
    const values = { status, notes: notes !== null && notes !== void 0 ? notes : row.notes };
    if (status === 'reviewed') {
        values.reviewedBy = userId;
    }
    if (status === 'approved') {
        values.approvedBy = userId;
    }
    await row.update(values);
    return row;
}
exports.updateFinalSettlementStatus = updateFinalSettlementStatus;
