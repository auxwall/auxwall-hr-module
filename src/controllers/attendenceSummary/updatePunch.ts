import { Model, ModelStatic, Op } from "sequelize";
import moment from "moment";
import { models } from "../../index";
import { updateAttendanceSummary } from "../../utils/attendenceLogic";

interface PunchInput {
  eventDate: string;
}

const updatePunch = async (id: number, date: string, updatedPunches: PunchInput[]) => {
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  // Optimize: only retrieve the staffId attribute
  const summary = await AttendenceSummary.findByPk(id, { attributes: ["staffId"] });
  if (!summary) {
    throw new Error("Attendance not found");
  }

  const staffId = summary.get("staffId");
  const sequelize = AttendenceSummary.sequelize!;
  const Punching = (models as any).punching || sequelize.models["attendance_transaction"];

  if (!Punching) {
    throw new Error("Punching model (attendance_transaction) not found in database.");
  }

  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();

  // Prep new punches
  const newPunches = updatedPunches
    .map(p => ({ staffId, eventDate: moment(p.eventDate, "YYYY-MM-DD HH:mm", true) }))
    .filter(p => p.eventDate.isValid())
    .map(p => ({ staffId: p.staffId, eventDate: p.eventDate.toDate() }));

  // Optimize: Wrap database writes in a transaction for atomicity and consistency
  const { insertedCount, deletedCount } = await sequelize.transaction(async (t) => {
    // 1. GET OLD PUNCHES (keep IDs)
    const oldPunches = await Punching.findAll({
      where: { staffId, eventDate: { [Op.between]: [startOfDay, endOfDay] } },
      attributes: ["id"],
      transaction: t
    });
    const oldIds = oldPunches.map((p: any) => p.id);

    // 2. INSERT NEW FIRST
    const inserted = await Punching.bulkCreate(newPunches, { transaction: t });

    // 3. DELETE ONLY OLD ONES BY ID
    if (oldIds.length > 0) {
      await Punching.destroy({ where: { id: { [Op.in]: oldIds } }, transaction: t });
    }

    return { insertedCount: inserted.length, deletedCount: oldIds.length };
  });

  // Optimize: Avoid redundant query. updateAttendanceSummary only extracts staffId & eventDate
  // from the punching record, and does its own DB queries.
  await updateAttendanceSummary([{ staffId, eventDate: date }], models);

  return { success: true, message: "Punch updated safely (old replaced)", inserted: insertedCount, deleted: deletedCount };
};

export default updatePunch;
