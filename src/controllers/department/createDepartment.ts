import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

interface Data { companyId: number; name: string; status?: boolean; createdBy?: number;}

const createDepartment = async (data: Data & { id?: number }) => {
  const Department = models.department as ModelStatic<Model>;
  if (data.id) {
    const existing = await Department.findByPk(data.id);
    if (existing) {
      return await existing.update(data as any);
    }
  }
  return await Department.create(data as any);
};

export default createDepartment;
