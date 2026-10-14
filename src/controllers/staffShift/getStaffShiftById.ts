import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getStaffShiftById = async (id: number) => {
  const StaffShift = models.staffShift as ModelStatic<Model>;
  const Department = models.department as ModelStatic<Model>;
  const result = await StaffShift.findByPk(id, {
    include: [{ model: Department, as: "department", attributes: ["id", "name"] }]
  });
  if (!result) {
    throw new Error(`Shift with ID ${id} not found.`);
  }
  return result;
};

export default getStaffShiftById;
