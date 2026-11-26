import { Model, ModelStatic, Op } from 'sequelize';
import { models } from '../index';

export const asData = (value: any) => value?.toJSON ? value.toJSON() : value;
export const requiredNumber = (value: any, label: string) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${label} must be a positive integer`);
  return number;
};

export async function assertStaffInCompany(companyId: number, staffId: number) {
  const Staff = models.staff as ModelStatic<Model> | undefined;
  if (!Staff) throw new Error('Staff model is not initialized');
  const sequelize = Staff.sequelize!;
  const relation = sequelize.models['user_Company_Relation'] || sequelize.models['userCompanyRelation'] || sequelize.models['company_user_relations'];
  if (relation) {
    const found = await relation.findOne({ where: { companyId, userId: staffId } });
    if (!found) throw new Error('Staff member does not belong to this company');
    const staff = await Staff.findByPk(staffId);
    if (!staff) throw new Error('Staff member not found');
    return asData(staff);
  }
  const Company = models.company as ModelStatic<Model> | undefined;
  if (Company) {
    const staff = await Staff.findOne({ where: { id: staffId }, include: [{ model: Company, where: { id: companyId }, required: true }] });
    if (!staff) throw new Error('Staff member does not belong to this company');
    return asData(staff);
  }
  throw new Error('Company membership model is not initialized');
}

export async function assertManagerInCompany(companyId: number, managerId?: number | null) {
  if (managerId) await assertStaffInCompany(companyId, managerId);
}

export async function getAnnualLeaveWorkdays(companyId: number, startDate: string, endDate: string, weeklyOffDays: number[] = [0, 6]) {
  const Holiday = models.publicHoliday as ModelStatic<Model>;
  const holidays = await Holiday.findAll({ where: { companyId, holidayDate: { [Op.lte]: endDate } } });
  const blockedDays = new Set<string>();
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));
  for (const raw of holidays as any[]) {
    const holiday = asData(raw);
    for (let year = startYear; year <= endYear; year++) {
      const original = new Date(`${holiday.holidayDate}T00:00:00Z`);
      const holidayStart = holiday.isRecurring ? new Date(Date.UTC(year, original.getUTCMonth(), original.getUTCDate())) : original;
      const holidayEndOriginal = new Date(`${holiday.endDate || holiday.holidayDate}T00:00:00Z`);
      const holidayEnd = holiday.isRecurring ? new Date(Date.UTC(year, holidayEndOriginal.getUTCMonth(), holidayEndOriginal.getUTCDate())) : holidayEndOriginal;
      for (const date = new Date(holidayStart); date <= holidayEnd; date.setUTCDate(date.getUTCDate() + 1)) blockedDays.add(date.toISOString().slice(0, 10));
      if (!holiday.isRecurring) break;
    }
  }
  let days = 0;
  const from = new Date(`${startDate}T00:00:00Z`);
  const to = new Date(`${endDate}T00:00:00Z`);
  if (to < from) throw new Error('End date must be on or after start date');
  for (const date = new Date(from); date <= to; date.setUTCDate(date.getUTCDate() + 1)) {
    if (!weeklyOffDays.includes(date.getUTCDay()) && !blockedDays.has(date.toISOString().slice(0, 10))) days++;
  }
  return days;
}