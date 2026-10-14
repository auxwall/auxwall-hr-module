import { Model, ModelStatic, Op } from "sequelize";
import moment from "moment";
import { models } from "../../index";
import getDocuments from "../document/getDocuments";
import getOfferLetters from "../offerLetter/getOfferLetters";

export interface FallbackAttendanceRecord { id: number; staffId: number; staffName: string; firstIn: string; lastOut: string; device?: string; status?: string;}

export interface HrDashboardOptions {
  fallbackAttendance?: FallbackAttendanceRecord[];
}

const getHrDashboardStats = async (companyId: number, options: HrDashboardOptions = {}) => {
  const Staff = models.staff as ModelStatic<Model> | undefined;
  const Company = models.company as ModelStatic<Model> | undefined;
  const Department = models.department as ModelStatic<Model> | undefined;
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model> | undefined;

  const today = moment().startOf('day');
  const todayDateStr = moment().format('YYYY-MM-DD');

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
    } catch (err: any) {
      console.warn('[HR Dashboard] Staff count error:', err?.message || err);
    }
  }

  // ── 2. Documents & Expiry Tracking ─────────────────────────────────────
  let totalDocuments = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;
  let validCount = 0;
  const urgentDocuments: any[] = [];

  try {
    const dbDocuments = await getDocuments(companyId, {});
    totalDocuments = dbDocuments?.length || 0;

    const documents = (dbDocuments || []).map((doc: any) => {
      const docJson = doc.toJSON ? doc.toJSON() : doc;
      const renewals = docJson.renewals || [];
      const latestRenewal = renewals.length > 0 ? renewals[0] : null;
      return { id: docJson.id, documentTypeId: docJson.documentTypeId, staffId: docJson.staffId, documentNumber: latestRenewal?.documentNumber || docJson.documentNumber || 'N/A', issueDate: latestRenewal?.issueDate || docJson.issueDate, expiryDate: latestRenewal?.expiryDate || docJson.expiryDate, staffName: docJson.staff ? (docJson.staff.fullName || docJson.staff.userName || 'Staff') : 'Company Document', documentType: docJson.documentType?.name || 'General Document'};
    });

    const seenGroups = new Set<string>();
    documents.forEach((doc: any) => {
      const groupKey = `${doc.documentTypeId || 0}_${doc.staffId || 0}`;
      if (!seenGroups.has(groupKey)) {
        seenGroups.add(groupKey);

        if (!doc.expiryDate) {
          validCount++;
          return;
        }

        const exp = moment(doc.expiryDate).startOf('day');
        const diffDays = exp.diff(today, 'days');

        if (diffDays < 0) {
          expiredCount++;
          urgentDocuments.push({ id: doc.id, staffName: doc.staffName, documentType: doc.documentType, documentNumber: doc.documentNumber, expiryDate: moment(doc.expiryDate).format('YYYY-MM-DD'), daysRemaining: diffDays, status: 'Expired'});
        } else if (diffDays <= 30) {
          expiringSoonCount++;
          urgentDocuments.push({ id: doc.id, staffName: doc.staffName, documentType: doc.documentType, documentNumber: doc.documentNumber, expiryDate: moment(doc.expiryDate).format('YYYY-MM-DD'), daysRemaining: diffDays, status: 'Expiring Soon'});
        } else {
          validCount++;
        }
      }
    });

    urgentDocuments.sort((a, b) => a.daysRemaining - b.daysRemaining);
  } catch (err: any) {
    console.warn('[HR Dashboard] Documents aggregation error:', err?.message || err);
  }

  // ── 3. Offer Letters Overview ──────────────────────────────────────────
  let totalOffers = 0;
  let draftCount = 0;
  let sentCount = 0;
  let acceptedCount = 0;
  const recentOfferLetters: any[] = [];

  try {
    const letters = await getOfferLetters(companyId, {});
    const allLetters = letters || [];
    totalOffers = allLetters.length;

    allLetters.forEach((l: any) => {
      const item = l.toJSON ? l.toJSON() : l;
      const st = item.status || 'Draft';
      if (st === 'Draft') draftCount++;
      else if (st === 'Sent') sentCount++;
      else if (st === 'Accepted') acceptedCount++;
    });

    allLetters.slice(0, 6).forEach((l: any) => {
      const item = l.toJSON ? l.toJSON() : l;
      const totalSalary = Number(item.basic || 0) + Number(item.housing || 0) + Number(item.transport || 0);
      recentOfferLetters.push({
        id: item.id,
        candidateName: item.candidateName || 'N/A',
        designation: item.designation || 'N/A',
        startDate: item.startDate ? moment(item.startDate).format('YYYY-MM-DD') : 'N/A',
        totalSalary,
        status: item.status || 'Draft',
        createdAt: item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD') : ''
      });
    });
  } catch (err: any) {
    console.warn('[HR Dashboard] Offer letters error:', err?.message || err);
  }

  // ── 4. Department Staff Distribution ───────────────────────────────────
  const departmentDistribution: any[] = [];
  try {
    if (Department) {
      const departments = await Department.findAll({ where: { companyId }, order: [['name', 'ASC']] });

      for (const dept of departments) {
        const dJson: any = dept.toJSON ? dept.toJSON() : dept;
        let count = 0;
        if (Staff) {
          const staffInclude = Company ? [{ model: Company, where: { id: companyId }, required: true }] : [];
          count = await Staff.count({include: staffInclude,where: { departmentId: dJson.id }}).catch(() => 0);
        }
        departmentDistribution.push({name: dJson.name || 'Department',value: count});
      }
    }
  } catch (err: any) {
    console.warn('[HR Dashboard] Department distribution error:', err?.message || err);
  }

  // ── 5. Today's Staff Attendance ────────────────────────────────────────
  let todayAttendance: any[] = [];

  try {
    if (AttendenceSummary) {
      const summaries = await AttendenceSummary.findAll({
        where: { companyId, attendenceDate: todayDateStr },
        order: [['first_in', 'ASC']]
      });

      if (summaries && summaries.length > 0) {
        todayAttendance = summaries.map((s: any) => {
          const item = s.toJSON ? s.toJSON() : s;
          return {
            id: item.id || item.staffId,
            staffId: item.staffId,
            staffName: item.staffName || `Staff #${item.staffId}`,
            firstIn: item.first_in ? moment(item.first_in, ['HH:mm:ss', 'HH:mm']).format('hh:mm A') : '--',
            lastOut: item.last_out ? moment(item.last_out, ['HH:mm:ss', 'HH:mm']).format('hh:mm A') : '--',
            workedMinutes: item.workedMinutes || 0,
            status: item.status || 'Present'
          };
        });
      }
    }
  } catch (err: any) {
    console.warn('[HR Dashboard] Attendance summary query error:', err?.message || err);
  }

  // Fallback to real-time punches if attendance summary is empty
  if (todayAttendance.length === 0 && options.fallbackAttendance && options.fallbackAttendance.length > 0) {
    todayAttendance = options.fallbackAttendance;
  }

  const presentCount = todayAttendance.length;
  const absentCount = Math.max(0, activeStaff - presentCount);

  return {
    staffStats: { totalStaff, activeStaff, inactiveStaff: totalStaff - activeStaff },
    attendanceStats: { presentCount, absentCount, attendanceRate: activeStaff > 0 ? Math.round((presentCount / activeStaff) * 100) : 0 },
    todayAttendance: todayAttendance.slice(0, 15),
    documentStats: { totalDocuments, expiredCount, expiringSoonCount, validCount, urgentCount: expiredCount + expiringSoonCount },
    offerLetterStats: { totalOffers, draftCount, sentCount, acceptedCount },
    urgentDocuments: urgentDocuments.slice(0, 8),
    recentOfferLetters,
    departmentDistribution
  };
};

export default getHrDashboardStats;
