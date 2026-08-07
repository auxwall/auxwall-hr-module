import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Data { type: 'week' | 'month'; data: any; companyId: number; departmentId?: number; name: string; createdBy?: number; id?: number;}

const createStaffSchedule = async (data: Data) => {
  const StaffSchedule = models.staffSchedule as ModelStatic<Model>;
  if (data.id) {
    const existing = await StaffSchedule.findByPk(data.id);
    if (existing) {
      const existingData = typeof existing.get('data') === "string" ? JSON.parse(existing.get('data') as string) : existing.get('data') || {};

      const newData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      const mergedData = { ...existingData, ...newData };

      return await existing.update({ ...data, data: mergedData } as any);
    }
  }
  return await StaffSchedule.create(data as any);
};

export default createStaffSchedule;
