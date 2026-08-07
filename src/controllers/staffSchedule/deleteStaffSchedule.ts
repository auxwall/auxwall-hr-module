import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteStaffSchedule = async (id: number) => {
  const StaffSchedule = models.staffSchedule as ModelStatic<Model>;
  const Staff = (models as any).staff as ModelStatic<Model> | undefined;

  if (Staff) {
    const assignedStaffCount = await Staff.count({ where: { scheduleId: id } });
    if (assignedStaffCount > 0) {
      throw new Error(`Cannot delete schedule because it is assigned to ${assignedStaffCount} staff member(s).`);
    }
  }

  const scheduleInstance = await StaffSchedule.findByPk(id);
  if (!scheduleInstance) {
    throw new Error(`Schedule with ID ${id} not found.`);
  }
  return await scheduleInstance.destroy();
};

export default deleteStaffSchedule;
