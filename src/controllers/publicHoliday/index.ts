import { Model, ModelStatic, Op } from 'sequelize';
import { models } from '../../index';

export async function getPublicHolidays(companyId: number, year?: number) {
  const where: any = { companyId };
  if (year) where.holidayDate = { [Op.lte]: `${year}-12-31` };
  return (models.publicHoliday as ModelStatic<Model>).findAll({ where, order: [['holidayDate','ASC']] });
}
export async function savePublicHoliday(data: any) {
  if (!data.name?.trim() || !data.holidayDate) throw new Error('Holiday name and date are required');
  if (data.endDate && data.endDate < data.holidayDate) throw new Error('End date cannot be before start date');
  const Holiday = models.publicHoliday as ModelStatic<Model>;
  const fields = ['name','holidayDate','endDate','appliesTo','isRecurring','notes'];
  const values: any = { updatedBy: data.userId };
  for (const key of fields) if (data[key] !== undefined) values[key] = data[key];
  if (values.name) values.name = values.name.trim();
  if (!values.appliesTo) values.appliesTo = 'all';
  if (data.id) {
    const row = await Holiday.findOne({ where: { id: Number(data.id), companyId: Number(data.companyId) } });
    if (!row) throw new Error('Public holiday not found');
    await row.update(values);
    return row;
  }
  return Holiday.create({ ...values, companyId: Number(data.companyId), createdBy: data.userId });
}
export async function deletePublicHoliday(companyId: number, id: number) {
  const count = await (models.publicHoliday as ModelStatic<Model>).destroy({ where: { companyId, id } });
  if (!count) throw new Error('Public holiday not found');
  return true;
}