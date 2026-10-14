import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getDepartmentById = async (id: number) => {
  const Department = models.department as ModelStatic<Model>;
  const include: any[] = [];
  if (Department.associations.staffs) {
    include.push({ association: "staffs", required: false });
  }
  return await Department.findByPk(id, { include });
};

export default getDepartmentById;
