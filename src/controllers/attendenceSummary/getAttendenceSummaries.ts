import { Model, ModelStatic, Op } from "sequelize";
import moment from "moment";
import { models } from "../../index";

interface Options { name?: string; status?: string; from?: string; to?: string; limit?: number; offset?: number; staffId?: number; }

function formatMinutesToHoursMinutes(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

const getAttendenceSummaries = async (companyId: number, options: Options = {}) => {
  const Staff = models.staff as ModelStatic<Model>;
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  const StaffShift = models.staffShift as ModelStatic<Model>;

  if (!Staff || !AttendenceSummary) {
    return { count: 0, totalLateStaff: 0, totalAbsentStaff: 0, totalPresentStaff: 0, totalHalfDayStaff: 0, rows: [] };
  }

  const sequelize = Staff.sequelize!;
  const CompanyUserRelation = sequelize.models["company_user_relations"] || sequelize.models["userCompanyRelation"] || sequelize.models["user_Company_Relation"];

  let userIds: number[] = [];
  if (options.staffId) {
    userIds = [options.staffId];
  } else if (CompanyUserRelation) {
    const relations = await CompanyUserRelation.findAll({ where: { companyId }, attributes: ["userId"], raw: true });
    userIds = relations.map((item: any) => item.userId);
  }

  if (userIds.length === 0) {
    return { count: 0, totalLateStaff: 0, totalAbsentStaff: 0, totalPresentStaff: 0, totalHalfDayStaff: 0, rows: []};
  }

  // Date range for summary cards
  let startDate = new Date();
  startDate.setDate(1); // Default to first day of month
  startDate.setHours(0, 0, 0, 0);

  let endDate = new Date(); // Default to today
  endDate.setHours(23, 59, 59, 999);

  if (options.from) {
    startDate = new Date(options.from);
    startDate.setHours(0, 0, 0, 0);
  }
  if (options.to) {
    endDate = new Date(options.to);
    endDate.setHours(23, 59, 59, 999);
  } else if (!options.from) {
    // If neither from nor to is provided, we default to current month but cap at today
    // already handled by defaults above
  }



  // Fetch summaries for the calculated date range, including status to avoid extra count queries
  const allSummaries = await AttendenceSummary.findAll({
    where: { staffId: { [Op.in]: userIds }, attendenceDate: { [Op.gte]: moment(startDate).format('YYYY-MM-DD'), [Op.lte]: moment(endDate).format('YYYY-MM-DD') } },
    attributes: ["staffId", "attendenceDate", "status"],
    raw: true
  });

  let totalLateStaff = 0;
  let totalPresentStaff = 0;
  let totalHalfDayStaff = 0;
  let totalAbsentStaff = 0;

  allSummaries.forEach((summary: any) => {
    const status = summary.status;
    if (status === 'Late') totalLateStaff++;
    else if (status === 'Present') totalPresentStaff++;
    else if (status === 'Half Day') totalHalfDayStaff++;
    else if (status === 'Absent') totalAbsentStaff++;

  });


  // Filters for queried list
  const whereClause: any = {
    staffId: { [Op.in]: userIds }
  };

  if (options.status) {
    whereClause.status = options.status;
  }

  if (options.from || options.to) {
    whereClause.attendenceDate = {};
    if (options.from) {
      whereClause.attendenceDate[Op.gte] = options.from;
    }
    if (options.to) {
      whereClause.attendenceDate[Op.lte] = options.to;
    }
  }

  const staffWhere: any = {};
  if (options.name) {
    staffWhere.fullName = {
      [Op.iLike]: `%${options.name}%`
    };
  }

  const queryOptions: any = {
    include: [{ model: Staff, as: 'staff', attributes: ['fullName', 'shiftId'], where: staffWhere }],
    where: whereClause,
    order: [['attendenceDate', 'DESC']]
  };

  if (options.limit !== undefined && options.offset !== undefined) {
    queryOptions.limit = options.limit;
    queryOptions.offset = options.offset;
  }

  const result = await AttendenceSummary.findAndCountAll(queryOptions);

  // Pre-index shift names for O(1) lookups during row mapping
  const shiftMap = new Map<number, string>();
  if (StaffShift) {
    const allShifts = await StaffShift.findAll({ attributes: ['id', 'shiftName'], raw: true }) as any[];
    allShifts.forEach((s) => {
      shiftMap.set(Number(s.id), s.shiftName);
    });
  }

  const mappedRows = result.rows.map((record: any) => {
    const staffShiftId = record.staff?.shiftId;
    const shiftName = staffShiftId ? shiftMap.get(Number(staffShiftId)) : null;

    return { ...record.toJSON(), staffName: record.staff?.fullName || null, shiftName, workedTime: formatMinutesToHoursMinutes(record.get('workedMinutes') || 0), lateTime: formatMinutesToHoursMinutes(record.get('lateMinutes') || 0), overtime: formatMinutesToHoursMinutes(record.get('overtimeMinutes') || 0), status: record.get('status') };
  });

  return { count: result.count, totalLateStaff, totalAbsentStaff, totalPresentStaff, totalHalfDayStaff, rows: mappedRows };
};

export default getAttendenceSummaries;
