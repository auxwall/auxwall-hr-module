import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const updateUnauthorizedAttendence = async (id: number, data: any) => {
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  const selectedAttendence = await AttendenceSummary.findByPk(id);
  if (!selectedAttendence) {
    throw new Error(`Attendence with ID ${id} not found.`);
  }
  return await selectedAttendence.update(data);
};

export default updateUnauthorizedAttendence;
