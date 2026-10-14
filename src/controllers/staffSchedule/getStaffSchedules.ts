import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Options {type?: string;departmentId?: number;limit?: number;offset?: number;}

const getStaffSchedules = async (companyId: number, options: Options = {}) => {
  const StaffSchedule = models.staffSchedule as ModelStatic<Model>;
  const Department = models.department as ModelStatic<Model>;

  const where: any = { companyId };
  if (options.type) {
    where.type = options.type;
  }
  if (options.departmentId) {
    where.departmentId = options.departmentId;
  }

  const queryOptions: any = { where, include: [ { model: Department, as: "department", attributes: ["id", "name"] } ]};

  const isPaginated = options.limit !== undefined && options.offset !== undefined;
  if (isPaginated) {
    queryOptions.limit = options.limit;
    queryOptions.offset = options.offset;
  }

  // Fetch schedules
  const result = isPaginated ? await StaffSchedule.findAndCountAll(queryOptions) : await StaffSchedule.findAll(queryOptions);
  const schedules = isPaginated ? (result as any).rows : (result as any[]);

  // Safely fetch shifts if StaffShift model is defined in the models proxy
  let allShifts: any[] = [];
  const StaffShift = (models as any).staffShift;
  if (StaffShift) {
    allShifts = await StaffShift.findAll({ where: { companyId }, attributes: ["id", "shiftName"] });
  }

  // Map shift IDs to shift names (with fallback to the shift ID if shift is not found)
  const mappedRows = schedules.map((s: any) => {
    const dataObj = s.get('data') || {};
    const existingData = typeof dataObj === 'string' ? JSON.parse(dataObj) : dataObj;
    const mappedData: any = {};

    for (const [day, shiftId] of Object.entries(existingData)) {
      const shift = allShifts.find(sh => sh.id === shiftId);
      mappedData[day] = shift ? shift.shiftName : shiftId;
    }

    return { id: s.get('id'), type: s.get('type'), name: s.get('name'), companyId: s.get('companyId'), departmentId: s.get('departmentId'), departmentName: s.get('department')?.name, data: mappedData, createdAt: s.get('createdAt'), updatedAt: s.get('updatedAt') };
  });

  if (isPaginated) {
    return { count: (result as any).count, rows: mappedRows };
  }

  return mappedRows;
};

export default getStaffSchedules;
