"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaveBalance = exports.reviewLeaveRequest = exports.saveLeaveRequest = exports.getLeaveRequests = exports.disableLeaveType = exports.saveLeaveType = exports.getLeaveTypes = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const hrShared_1 = require("../hrShared");
async function getLeaveTypes(companyId, includeInactive = false) {
    return index_1.models.leaveType.findAll({
        where: {
            companyId,
            ...(includeInactive ? {} : { isActive: true }),
        },
        order: [['name', 'ASC']],
    });
}
exports.getLeaveTypes = getLeaveTypes;
async function saveLeaveType(data) {
    var _a;
    if (!((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new Error('Leave type name is required');
    }
    const entitlement = Number(data.annualEntitlementDays || 0);
    const carryover = Number(data.carryoverLimitDays || 0);
    if (entitlement < 0 || carryover < 0) {
        throw new Error('Leave entitlement and carryover must be zero or greater');
    }
    const weeklyOffDays = Array.isArray(data.weeklyOffDays)
        ? data.weeklyOffDays.map(Number)
        : [0, 6];
    if (weeklyOffDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
        throw new Error('weeklyOffDays must contain weekday numbers from 0 to 6');
    }
    const Type = index_1.models.leaveType;
    const values = {
        name: data.name.trim(),
        annualEntitlementDays: entitlement,
        carryoverLimitDays: carryover,
        weeklyOffDays,
        isPaid: data.isPaid !== false,
        requiresDocument: !!data.requiresDocument,
        isActive: data.isActive !== false,
        updatedBy: data.userId,
    };
    if (data.id) {
        const row = await Type.findOne({
            where: {
                id: Number(data.id),
                companyId: Number(data.companyId),
            },
        });
        if (!row) {
            throw new Error('Leave type not found');
        }
        await row.update(values);
        return row;
    }
    return Type.create({
        ...values,
        companyId: Number(data.companyId),
        createdBy: data.userId,
    });
}
exports.saveLeaveType = saveLeaveType;
async function disableLeaveType(companyId, id, userId) {
    const row = (await index_1.models.leaveType.findOne({ where: { id, companyId } }));
    if (!row) {
        throw new Error('Leave type not found');
    }
    await row.update({ isActive: false, updatedBy: userId });
    return true;
}
exports.disableLeaveType = disableLeaveType;
async function getLeaveRequests(companyId, options = {}) {
    const where = { companyId };
    if (options.staffId) {
        where.staffId = Number(options.staffId);
    }
    if (options.status) {
        where.status = options.status;
    }
    return index_1.models.leaveRequest.findAll({
        where,
        include: [{ model: index_1.models.leaveType, as: 'leaveType' }],
        order: [['startDate', 'DESC']],
    });
}
exports.getLeaveRequests = getLeaveRequests;
async function saveLeaveRequest(data) {
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const Type = index_1.models.leaveType;
    const type = (await Type.findOne({
        where: {
            id: Number(data.leaveTypeId),
            companyId,
            isActive: true,
        },
    }));
    if (!type) {
        throw new Error('Select an active leave type');
    }
    if (!data.startDate ||
        !data.endDate ||
        data.endDate < data.startDate) {
        throw new Error('Valid leave dates are required');
    }
    const requestedDays = await (0, hrShared_1.getAnnualLeaveWorkdays)(companyId, data.startDate, data.endDate, type.weeklyOffDays || [0, 6]);
    if (!requestedDays) {
        throw new Error('Selected dates contain no working days after weekends and public holidays');
    }
    const Request = index_1.models.leaveRequest;
    const overlap = await Request.findOne({
        where: {
            companyId,
            staffId,
            status: { [sequelize_1.Op.in]: ['pending', 'approved'] },
            startDate: { [sequelize_1.Op.lte]: data.endDate },
            endDate: { [sequelize_1.Op.gte]: data.startDate },
            ...(data.id
                ? { id: { [sequelize_1.Op.ne]: Number(data.id) } }
                : {}),
        },
    });
    if (overlap) {
        throw new Error('Leave dates overlap another pending or approved request');
    }
    const values = {
        leaveTypeId: type.id,
        startDate: data.startDate,
        endDate: data.endDate,
        requestedDays,
        reason: data.reason || null,
        attachmentKey: data.attachmentKey || null,
        updatedBy: data.userId,
    };
    if (data.id) {
        const where = {
            id: Number(data.id),
            companyId,
        };
        if (!data.isAdmin) {
            where.status = 'pending';
        }
        const row = (await Request.findOne({ where }));
        if (!row) {
            throw new Error(data.isAdmin
                ? 'Leave request not found'
                : 'Approved or rejected leave requests cannot be modified by staff');
        }
        await row.update(values);
        return row;
    }
    return Request.create({
        ...values,
        companyId,
        staffId,
        createdBy: data.userId,
    });
}
exports.saveLeaveRequest = saveLeaveRequest;
async function reviewLeaveRequest(companyId, id, status, userId, reviewNotes) {
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
        throw new Error('Invalid leave review status');
    }
    const row = (await index_1.models.leaveRequest.findOne({ where: { id, companyId } }));
    if (!row) {
        throw new Error('Leave request not found');
    }
    if (row.status !== 'pending' && status !== 'cancelled') {
        throw new Error('Only pending leave requests can be reviewed');
    }
    await row.update({
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        updatedBy: userId,
    });
    return row;
}
exports.reviewLeaveRequest = reviewLeaveRequest;
async function getLeaveBalance(companyId, staffId, year = new Date().getFullYear()) {
    const staff = await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const allRequests = (await index_1.models.leaveRequest.findAll({
        where: {
            companyId,
            staffId,
            status: 'approved',
            startDate: { [sequelize_1.Op.lte]: `${year}-12-31` },
            endDate: { [sequelize_1.Op.gte]: `${year - 1}-01-01` },
        },
    }));
    const types = (await getLeaveTypes(companyId));
    const joined = staff.joinDate
        ? new Date(`${staff.joinDate}T00:00:00Z`)
        : new Date(`${year - 1}-01-01T00:00:00Z`);
    const yearDates = (targetYear) => ({
        start: new Date(`${targetYear}-01-01T00:00:00Z`),
        end: new Date(`${targetYear}-12-31T00:00:00Z`),
    });
    const annualFraction = (targetYear) => {
        const { start, end } = yearDates(targetYear);
        const from = joined > start ? joined : start;
        return Math.max(0, Math.min(1, (end.getTime() - from.getTime() + 86400000) /
            (end.getTime() - start.getTime() + 86400000)));
    };
    const totals = new Map();
    for (const rawRequest of allRequests) {
        const request = (0, hrShared_1.asData)(rawRequest);
        const leaveTypeId = Number(request.leaveTypeId);
        const stats = totals.get(leaveTypeId) || {
            current: 0,
            previous: 0,
        };
        const type = types
            .map(hrShared_1.asData)
            .find((candidate) => Number(candidate.id) === leaveTypeId);
        if (!type)
            continue;
        const previousStart = request.startDate > `${year - 1}-01-01`
            ? request.startDate
            : `${year - 1}-01-01`;
        const previousEnd = request.endDate < `${year - 1}-12-31`
            ? request.endDate
            : `${year - 1}-12-31`;
        if (previousStart <= previousEnd) {
            stats.previous += await (0, hrShared_1.getAnnualLeaveWorkdays)(companyId, previousStart, previousEnd, type.weeklyOffDays || [0, 6]);
        }
        const currentStart = request.startDate > `${year}-01-01`
            ? request.startDate
            : `${year}-01-01`;
        const currentEnd = request.endDate < `${year}-12-31`
            ? request.endDate
            : `${year}-12-31`;
        if (currentStart <= currentEnd) {
            stats.current += await (0, hrShared_1.getAnnualLeaveWorkdays)(companyId, currentStart, currentEnd, type.weeklyOffDays || [0, 6]);
        }
        totals.set(leaveTypeId, stats);
    }
    return Promise.all(types.map(async (rawType) => {
        const type = (0, hrShared_1.asData)(rawType);
        const used = totals.get(Number(type.id)) || {
            current: 0,
            previous: 0,
        };
        // Full year entitlement without pro-rating by join date
        const entitlementDays = Math.round(Number(type.annualEntitlementDays || 0));
        const previousEntitlement = Math.round(Number(type.annualEntitlementDays || 0));
        const carryoverDays = Math.round(Math.min(Math.max(0, previousEntitlement - used.previous), Number(type.carryoverLimitDays || 0)));
        const usedDays = Math.round(Number(used.current || 0) * 2) / 2;
        const rawRemaining = entitlementDays + carryoverDays - usedDays;
        const remainingDays = Math.max(0, Math.round(rawRemaining * 2) / 2);
        const advanceDays = rawRemaining < 0 ? Math.round(Math.abs(rawRemaining) * 2) / 2 : 0;
        return {
            leaveTypeId: type.id,
            leaveType: type.name,
            year,
            entitlementDays,
            carryoverDays,
            usedDays,
            remainingDays,
            advanceDays,
            rawRemainingDays: Math.round(rawRemaining * 2) / 2,
        };
    }));
}
exports.getLeaveBalance = getLeaveBalance;
