import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";

interface Options { departmentId?: number; name?: string; limit?: number; offset?: number; }

const getStaffShifts = async (companyId: number, options: Options = {}) => {
  const StaffShift = models.staffShift as ModelStatic<Model>;
  const Department = models.department as ModelStatic<Model>;

  const where: any = { companyId };
  if (options.departmentId) {
    where.departmentId = options.departmentId;
  }
  if (options.name) {
    where.shiftName = { [Op.iLike]: `%${options.name}%` };
  }

  const queryOptions: any = {
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name'] }
    ],
    order: [['id', 'ASC']]
  };

  const isPaginated = options.limit !== undefined && options.offset !== undefined;
  if (isPaginated) {
    queryOptions.limit = options.limit;
    queryOptions.offset = options.offset;
  }

  if (isPaginated) {
    return await StaffShift.findAndCountAll(queryOptions);
  }
  return await StaffShift.findAll(queryOptions);
};

export default getStaffShifts;
