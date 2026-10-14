import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";

interface Data { id?: number; shiftName: string; shiftColor?: string; shiftStart: string; shiftEnd: string; breakMinutes?: number; lateGraceMinutes?: number; overtimeMinutes?: number; companyId: number; departmentId?: number; uploadedBy?: number;}

const createStaffShift = async (data: Data) => {
  const StaffShift = models.staffShift as ModelStatic<Model>;

  // Check for name/color clashes inside the same company
  const clashWhere: any[] = [];
  if (data.shiftName) {
    clashWhere.push({ shiftName: data.shiftName });
  }
  if (data.shiftColor) {
    clashWhere.push({ shiftColor: data.shiftColor });
  }

  if (clashWhere.length > 0) {
    const existingShift = await StaffShift.findOne({
      where: {
        companyId: data.companyId,
        [Op.or]: clashWhere,
        ...(data.id ? { id: { [Op.ne]: data.id } } : {}) // ignore the shift being edited
      }
    });

    if (existingShift) {
      if (existingShift.get("shiftName") === data.shiftName) {
        throw new Error("Shift already exists");
      }
      if (existingShift.get("shiftColor") === data.shiftColor) {
        throw new Error("Color already exists");
      }
    }
  }

  if (data.id) {
    const existing = await StaffShift.findByPk(data.id);
    if (!existing) {
      throw new Error(`Shift with ID ${data.id} not found.`);
    }
    return await existing.update(data as any);
  }

  return await StaffShift.create(data as any);
};

export default createStaffShift;
