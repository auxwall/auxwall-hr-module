import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";
import moment from "moment";

const getMonthlyReport = async (companyId: number, options: { year?: number, month?: number, from?: string, to?: string, name?: string, staffId?: number } = {}) => {
  const Staff = models.staff as ModelStatic<Model>;
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;

  if (!Staff || !AttendenceSummary) {
    return { totalLeaveOfMonth: 0, totalPresentOfMonth: 0, totalLateOfMonth: 0, monthlyReport: []};
  }

  const sequelize = Staff.sequelize!;
  const CompanyUserRelation = sequelize.models["company_user_relations"] || sequelize.models["userCompanyRelation"] || sequelize.models["user_Company_Relation"];

  let userIds: number[] = [];
  if (CompanyUserRelation) {
    const relations = await CompanyUserRelation.findAll({ where: { companyId }, attributes: ["userId"], raw: true });
    let allUserIds = relations.map((item: any) => item.userId);
    userIds = allUserIds;
  }
  
  let allUserIds = [...userIds];
  // Filter userIds if a specific staff is requested
  if (options.staffId) {
    userIds = allUserIds.filter((id: number) => id === Number(options.staffId));
  }

  if (allUserIds.length === 0) {
    return { totalLeaveOfMonth: 0, totalPresentOfMonth: 0, totalLateOfMonth: 0, monthlyReport: []};
  }

  let startDate: Date;
  let endDate: Date;

  if (options.from && options.to) {
    startDate = moment(options.from).startOf('day').toDate();
    endDate = moment(options.to).endOf('day').toDate();
  } else {
    const _year = options.year ? options.year : moment().year();
    const _month = options.month !== undefined ? options.month : moment().month();
    startDate = moment().year(_year).month(_month).startOf('month').toDate();
    endDate = moment().year(_year).month(_month).endOf('month').toDate();
  }

  // 1. Fetch all aggregated data in a single query using Group By and conditional aggregation
  const summaries = await AttendenceSummary.findAll({
    attributes: [
      "staffId",
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Absent' THEN 1 END")), "totalLeave"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Present' THEN 1 END")), "totalPresent"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Late' THEN 1 END")), "totalLate"],
      [sequelize.fn("COUNT", sequelize.literal("CASE WHEN status = 'Half Day' THEN 1 END")), "totalHalfDay"],
      [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("overtimeMinutes")), 0), "overtime"]
    ],
    where: { 
      staffId: { [Op.in]: userIds }, 
      attendenceDate: { [Op.gte]: moment(startDate).format('YYYY-MM-DD'), [Op.lte]: moment(endDate).format('YYYY-MM-DD') } 
    },
    group: ["staffId"],
    raw: true
  }) as any[];

  // 2. Fetch staff list for the report
  const staffWhere: any = { id: { [Op.in]: userIds } };
  if (options.name) {
    staffWhere.fullName = { [Op.iLike]: `%${options.name}%` };
  }
  const staffList = await Staff.findAll({ where: staffWhere, attributes: ["id", "fullName"], raw: true }) as any[];

  // 3. Map aggregates to a fast lookup structure
  const summaryMap = new Map<number, { totalLeave: number; totalPresent: number; totalLate: number; totalHalfDay: number; overtime: number }>();
  summaries.forEach((s) => {
    summaryMap.set(Number(s.staffId), { totalLeave: Number(s.totalLeave || 0), totalPresent: Number(s.totalPresent || 0), totalLate: Number(s.totalLate || 0), totalHalfDay: Number(s.totalHalfDay || 0), overtime: Number(s.overtime || 0)});
  });

  // 4. Build report & compute totals in a single pass in memory
  let totalLeaveOfMonth = 0;
  let totalPresentOfMonth = 0;
  let totalLateOfMonth = 0;

  const report = staffList.map((staff: any) => {
    const staffId = Number(staff.id);
    const stats = summaryMap.get(staffId) || { totalLeave: 0, totalPresent: 0, totalLate: 0, totalHalfDay: 0, overtime: 0 };

    totalLeaveOfMonth += stats.totalLeave;
    totalPresentOfMonth += stats.totalPresent;
    totalLateOfMonth += stats.totalLate;

    return { staffId, staffName: staff.fullName, totalLeave: stats.totalLeave, totalPresent: stats.totalPresent, totalLate: stats.totalLate, totalHalfDay: stats.totalHalfDay, overtime: stats.overtime };
  });

  return { totalLeaveOfMonth, totalPresentOfMonth, totalLateOfMonth, monthlyReport: report };
};

export default getMonthlyReport;
