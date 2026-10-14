import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getStaffScheduleById = async (id: number) => {
  const StaffSchedule = models.staffSchedule as ModelStatic<Model>;
  const Department = models.department as ModelStatic<Model>;

  const scheduleInstance = await StaffSchedule.findByPk(id, {
    include: [{ model: Department, as: "department", attributes: ["id", "name"] }]
  });
  if (!scheduleInstance) {
    throw new Error(`Schedule with ID ${id} not found.`);
  }
  return scheduleInstance;
};

export default getStaffScheduleById;
