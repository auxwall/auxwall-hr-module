import { Model, ModelStatic, Op } from "sequelize";
import { models } from "../../index";

interface Options {
  status?: boolean;
  name?: string;
}

const getDepartments = async (companyId: number, options: Options = {}) => {
  const Department = models.department as ModelStatic<Model>;
  const where: any = { companyId };

  if (options.status !== undefined) {
    where.status = options.status;
  }

  if (options.name) {
    where.name = {
      [Op.iLike]: `%${options.name}%`
    };
  }

  const include: any[] = [];
  if (Department.associations.staffs) {
    include.push({ association: "staffs", required: false });
  }

  return await Department.findAll({ where, include, order: [["id", "ASC"]] });
};

export default getDepartments;
