import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const getAttendenceStatus = async () => {
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  return (AttendenceSummary.rawAttributes as any).status.values;
};

export default getAttendenceStatus;
