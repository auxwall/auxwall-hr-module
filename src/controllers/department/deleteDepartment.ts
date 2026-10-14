import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteDepartment = async (id: number, companyId: number) => {
  const Department = models.department as ModelStatic<Model>;
  const Staff = (models as any).staff as ModelStatic<Model> | undefined;

  if (Staff) {
    const assignedStaffCount = await Staff.count({ where: { departmentId: id } });
    if (assignedStaffCount > 0) {
      throw new Error(`Cannot delete department because it is assigned to ${assignedStaffCount} staff member(s).`);
    }
  }

  const departmentInstance = await Department.findOne({ where: { id, companyId } });
  if (!departmentInstance) {
    throw new Error(`Department with ID ${id} not found.`);
  }

  return await departmentInstance.destroy();
};

export default deleteDepartment;
