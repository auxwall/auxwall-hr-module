import { Model, ModelStatic } from "sequelize";
import { models } from "../../index";

const deleteUnauthorizedAttendence = async (id: number) => {
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  const Staff = models.staff as ModelStatic<Model>;

  const selectedAttendence = await AttendenceSummary.findByPk(id);
  if (!selectedAttendence) {
    throw new Error(`Attendence with ID ${id} not found.`);
  }

  const staffId = selectedAttendence.get("staffId") as number;
  const attendenceDate = selectedAttendence.get("attendenceDate");

  let staff: any = null;
  if (Staff && staffId) {
    staff = await Staff.findByPk(staffId);
  }

  // Delete from summary table
  await selectedAttendence.destroy();

  // Delete from main transaction table using staffId + date + name if model exists
  const sequelize = AttendenceSummary.sequelize!;
  const Punching = (models as any).punching || sequelize.models["attendance_transaction"];
  if (Punching && staffId && attendenceDate) {
    const where: any = { staffId: staffId, eventDate: attendenceDate };
    if (staff) {
      // In deleteUnauthorizedAttendence.ts in service, it did: staffName: staff.fullName
      where.staffName = staff.fullName || staff.get("fullName");
    }
    await Punching.destroy({ where });
  }

  return selectedAttendence;
};

export default deleteUnauthorizedAttendence;
