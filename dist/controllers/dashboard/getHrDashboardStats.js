"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const index_1 = require("../../index");
const getDocuments_1 = __importDefault(require("../document/getDocuments"));
const getOfferLetters_1 = __importDefault(require("../offerLetter/getOfferLetters"));
const getHrDashboardStats = async (companyId, options = {}) => {
    const Staff = index_1.models.staff;
    const Company = index_1.models.company;
    const Department = index_1.models.department;
    const AttendenceSummary = index_1.models.attendenceSummary;
    const today = (0, moment_1.default)().startOf('day');
    const todayDateStr = (0, moment_1.default)().format('YYYY-MM-DD');
    // ── 1. Staff Statistics ────────────────────────────────────────────────
    let totalStaff = 0;
    let activeStaff = 0;
    if (Staff) {
        try {
            const staffInclude = Company ? [{ model: Company, where: { id: companyId }, required: true }] : [];
            totalStaff = await Staff.count({ include: staffInclude });
            activeStaff = await Staff.count({
                include: staffInclude,
                where: { status: true }
            });
        }
        catch (err) {
            console.warn('[HR Dashboard] Staff count error:', (err === null || err === void 0 ? void 0 : err.message) || err);
        }
    }
    // ── 2. Documents & Expiry Tracking ─────────────────────────────────────
    let totalDocuments = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let validCount = 0;
    const urgentDocuments = [];
    try {
        const dbDocuments = await (0, getDocuments_1.default)(companyId, {});
        totalDocuments = (dbDocuments === null || dbDocuments === void 0 ? void 0 : dbDocuments.length) || 0;
        const documents = (dbDocuments || []).map((doc) => {
            var _a;
            const docJson = doc.toJSON ? doc.toJSON() : doc;
            const renewals = docJson.renewals || [];
            const latestRenewal = renewals.length > 0 ? renewals[0] : null;
            return {
                id: docJson.id,
                documentTypeId: docJson.documentTypeId,
                staffId: docJson.staffId,
                documentNumber: (latestRenewal === null || latestRenewal === void 0 ? void 0 : latestRenewal.documentNumber) || docJson.documentNumber || 'N/A',
                issueDate: (latestRenewal === null || latestRenewal === void 0 ? void 0 : latestRenewal.issueDate) || docJson.issueDate,
                expiryDate: (latestRenewal === null || latestRenewal === void 0 ? void 0 : latestRenewal.expiryDate) || docJson.expiryDate,
                staffName: docJson.staff ? (docJson.staff.fullName || docJson.staff.userName || 'Staff') : 'Company Document',
                documentType: ((_a = docJson.documentType) === null || _a === void 0 ? void 0 : _a.name) || 'General Document'
            };
        });
        const seenGroups = new Set();
        documents.forEach((doc) => {
            const groupKey = `${doc.documentTypeId || 0}_${doc.staffId || 0}`;
            if (!seenGroups.has(groupKey)) {
                seenGroups.add(groupKey);
                if (!doc.expiryDate) {
                    validCount++;
                    return;
                }
                const exp = (0, moment_1.default)(doc.expiryDate).startOf('day');
                const diffDays = exp.diff(today, 'days');
                if (diffDays < 0) {
                    expiredCount++;
                    urgentDocuments.push({
                        id: doc.id,
                        staffName: doc.staffName,
                        documentType: doc.documentType,
                        documentNumber: doc.documentNumber,
                        expiryDate: (0, moment_1.default)(doc.expiryDate).format('YYYY-MM-DD'),
                        daysRemaining: diffDays,
                        status: 'Expired'
                    });
                }
                else if (diffDays <= 30) {
                    expiringSoonCount++;
                    urgentDocuments.push({
                        id: doc.id,
                        staffName: doc.staffName,
                        documentType: doc.documentType,
                        documentNumber: doc.documentNumber,
                        expiryDate: (0, moment_1.default)(doc.expiryDate).format('YYYY-MM-DD'),
                        daysRemaining: diffDays,
                        status: 'Expiring Soon'
                    });
                }
                else {
                    validCount++;
                }
            }
        });
        urgentDocuments.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }
    catch (err) {
        console.warn('[HR Dashboard] Documents aggregation error:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
    // ── 3. Offer Letters Overview ──────────────────────────────────────────
    let totalOffers = 0;
    let draftCount = 0;
    let sentCount = 0;
    let acceptedCount = 0;
    const recentOfferLetters = [];
    try {
        const letters = await (0, getOfferLetters_1.default)(companyId, {});
        const allLetters = letters || [];
        totalOffers = allLetters.length;
        allLetters.forEach((l) => {
            const item = l.toJSON ? l.toJSON() : l;
            const st = item.status || 'Draft';
            if (st === 'Draft')
                draftCount++;
            else if (st === 'Sent')
                sentCount++;
            else if (st === 'Accepted')
                acceptedCount++;
        });
        allLetters.slice(0, 6).forEach((l) => {
            const item = l.toJSON ? l.toJSON() : l;
            const totalSalary = Number(item.basic || 0) + Number(item.housing || 0) + Number(item.transport || 0);
            recentOfferLetters.push({
                id: item.id,
                candidateName: item.candidateName || 'N/A',
                designation: item.designation || 'N/A',
                startDate: item.startDate ? (0, moment_1.default)(item.startDate).format('YYYY-MM-DD') : 'N/A',
                totalSalary,
                status: item.status || 'Draft',
                createdAt: item.createdAt ? (0, moment_1.default)(item.createdAt).format('YYYY-MM-DD') : ''
            });
        });
    }
    catch (err) {
        console.warn('[HR Dashboard] Offer letters error:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
    // ── 4. Department Staff Distribution ───────────────────────────────────
    const departmentDistribution = [];
    try {
        if (Department) {
            const departments = await Department.findAll({
                where: { companyId },
                order: [['name', 'ASC']]
            });
            for (const dept of departments) {
                const dJson = dept.toJSON ? dept.toJSON() : dept;
                let count = 0;
                if (Staff) {
                    const staffInclude = Company ? [{ model: Company, where: { id: companyId }, required: true }] : [];
                    count = await Staff.count({
                        include: staffInclude,
                        where: { departmentId: dJson.id }
                    }).catch(() => 0);
                }
                departmentDistribution.push({
                    name: dJson.name || 'Department',
                    value: count
                });
            }
        }
    }
    catch (err) {
        console.warn('[HR Dashboard] Department distribution error:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
    // ── 5. Today's Staff Attendance ────────────────────────────────────────
    let todayAttendance = [];
    try {
        if (AttendenceSummary) {
            const summaries = await AttendenceSummary.findAll({
                where: { companyId, attendenceDate: todayDateStr },
                order: [['first_in', 'ASC']]
            });
            if (summaries && summaries.length > 0) {
                todayAttendance = summaries.map((s) => {
                    const item = s.toJSON ? s.toJSON() : s;
                    return {
                        id: item.id || item.staffId,
                        staffId: item.staffId,
                        staffName: item.staffName || `Staff #${item.staffId}`,
                        firstIn: item.first_in ? (0, moment_1.default)(item.first_in, ['HH:mm:ss', 'HH:mm']).format('hh:mm A') : '--',
                        lastOut: item.last_out ? (0, moment_1.default)(item.last_out, ['HH:mm:ss', 'HH:mm']).format('hh:mm A') : '--',
                        workedMinutes: item.workedMinutes || 0,
                        status: item.status || 'Present'
                    };
                });
            }
        }
    }
    catch (err) {
        console.warn('[HR Dashboard] Attendance summary query error:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
    // Fallback to real-time punches if attendance summary is empty
    if (todayAttendance.length === 0 && options.fallbackAttendance && options.fallbackAttendance.length > 0) {
        todayAttendance = options.fallbackAttendance;
    }
    const presentCount = todayAttendance.length;
    const absentCount = Math.max(0, activeStaff - presentCount);
    return {
        staffStats: {
            totalStaff,
            activeStaff,
            inactiveStaff: totalStaff - activeStaff
        },
        attendanceStats: {
            presentCount,
            absentCount,
            attendanceRate: activeStaff > 0 ? Math.round((presentCount / activeStaff) * 100) : 0
        },
        todayAttendance: todayAttendance.slice(0, 15),
        documentStats: {
            totalDocuments,
            expiredCount,
            expiringSoonCount,
            validCount,
            urgentCount: expiredCount + expiringSoonCount
        },
        offerLetterStats: {
            totalOffers,
            draftCount,
            sentCount,
            acceptedCount
        },
        urgentDocuments: urgentDocuments.slice(0, 8),
        recentOfferLetters,
        departmentDistribution
    };
};
exports.default = getHrDashboardStats;
