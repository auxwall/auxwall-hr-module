import { Model, ModelStatic, Op } from "sequelize";
import moment from "moment";
import { models } from "../../index";

const getAttendenceSummaryById = async (id: number, date: string) => {
  const AttendenceSummary = models.attendenceSummary as ModelStatic<Model>;
  const result = await AttendenceSummary.findByPk(id);

  if (!result) {
    throw new Error("Attendance not found");
  }

  const staffId = result.get("staffId");
  const sequelize = AttendenceSummary.sequelize!;
  const Punching = (models as any).punching || sequelize.models["attendance_transaction"];

  let rawPunches: any[] = [];
  if (Punching && staffId && date) {
    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();
    rawPunches = await Punching.findAll({ where: { staffId, eventDate: { [Op.between]: [startOfDay, endOfDay] } }, order: [["eventDate", "ASC"]] });
  }

  const attendance = {
    ...result.toJSON(),
    first_in: result.get("first_in") ? moment.utc(result.get("first_in") as string, "HH:mm:ss", true).local().format("HH:mm:ss") : null,
    last_out: result.get("last_out") ? moment.utc(result.get("last_out") as string, "HH:mm:ss", true).local().format("HH:mm:ss") : null
  };

  const formattedPunches = rawPunches.map(p => {
    const evDate = p.get ? p.get("eventDate") : p.eventDate;
    return { ...(p.toJSON ? p.toJSON() : p), eventDate: moment.utc(evDate).local().format("YYYY-MM-DD HH:mm:ss"), eventTime: moment.utc(evDate).local().format("HH:mm") };
  });

  const inPunches: any[] = [];
  const outPunches: any[] = [];

  formattedPunches.forEach((p, index) => {
    if (index % 2 === 0) {
      inPunches.push(p);
    } else {
      outPunches.push(p);
    }
  });

  return { attendance, punches: formattedPunches, inPunches, outPunches };
};

export default getAttendenceSummaryById;
