import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteStaffShift = async (id: number) => {
  const StaffShift = models.staffShift as ModelStatic<Model>;
  const Staff = (models as any).staff as ModelStatic<Model> | undefined;

  if (Staff) {
    const assignedStaffCount = await Staff.count({ where: { shiftId: id } });
    if (assignedStaffCount > 0) {
      throw new Error(`Cannot delete shift because it is assigned to ${assignedStaffCount} staff member(s).`);
    }
  }

  const selectedShift = await StaffShift.findByPk(id);
  if (!selectedShift) {
    throw new Error(`Shift with ID ${id} not found.`);
  }
  return await selectedShift.destroy();
};

export default deleteStaffShift;
