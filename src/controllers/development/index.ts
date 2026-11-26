import { Model, ModelStatic } from 'sequelize';
import { models } from '../../index';
import { assertStaffInCompany } from '../hrShared';

export async function getTrainingRecords(
  companyId: number,
  options: any = {},
) {
  return (models.trainingRecord as ModelStatic<Model>).findAll({
    where: {
      companyId,
      ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    order: [
      ['dueDate', 'ASC'],
      ['id', 'DESC'],
    ],
  });
}

export async function saveTrainingRecord(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);

  await assertStaffInCompany(companyId, staffId);

  if (!data.courseName?.trim()) {
    throw new Error('Course name is required');
  }

  const Record = models.trainingRecord as ModelStatic<Model>;
  const fields = [
    'courseName',
    'provider',
    'assignedDate',
    'dueDate',
    'completedDate',
    'status',
    'certificateKey',
    'notes',
  ];
  const values: any = { updatedBy: data.userId };

  for (const key of fields) {
    if (data[key] !== undefined) {
      values[key] = data[key];
    }
  }

  if (data.id) {
    const row = await Record.findOne({
      where: { id: Number(data.id), companyId },
    });

    if (!row) {
      throw new Error('Training record not found');
    }

    await row.update(values);
    return row;
  }

  return Record.create({
    ...values,
    companyId,
    staffId,
    createdBy: data.userId,
  });
}

export async function deleteTrainingRecord(companyId: number, id: number) {
  const count = await (
    models.trainingRecord as ModelStatic<Model>
  ).destroy({ where: { companyId, id } });

  if (!count) {
    throw new Error('Training record not found');
  }

  return true;
}

export async function getPerformanceReviews(
  companyId: number,
  options: any = {},
) {
  return (models.performanceReview as ModelStatic<Model>).findAll({
    where: {
      companyId,
      ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    order: [['periodEnd', 'DESC']],
  });
}

export async function savePerformanceReview(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);

  await assertStaffInCompany(companyId, staffId);

  if (
    !data.periodStart ||
    !data.periodEnd ||
    data.periodEnd < data.periodStart
  ) {
    throw new Error('A valid review period is required');
  }

  if (
    data.rating !== undefined &&
    data.rating !== null &&
    (Number(data.rating) < 0 || Number(data.rating) > 5)
  ) {
    throw new Error('Rating must be between 0 and 5');
  }

  const Review = models.performanceReview as ModelStatic<Model>;
  const fields = [
    'reviewerId',
    'periodStart',
    'periodEnd',
    'goals',
    'rating',
    'employeeComments',
    'managerFeedback',
    'status',
  ];
  const values: any = { updatedBy: data.userId };

  for (const key of fields) {
    if (data[key] !== undefined) {
      values[key] = data[key];
    }
  }

  if (values.status === 'completed') {
    values.completedAt = new Date();
  }

  if (data.id) {
    const row = await Review.findOne({
      where: { id: Number(data.id), companyId },
    });

    if (!row) {
      throw new Error('Performance review not found');
    }

    await row.update(values);
    return row;
  }

  return Review.create({
    ...values,
    companyId,
    staffId,
    createdBy: data.userId,
  });
}

export async function deletePerformanceReview(companyId: number, id: number) {
  const count = await (
    models.performanceReview as ModelStatic<Model>
  ).destroy({ where: { companyId, id } });

  if (!count) {
    throw new Error('Performance review not found');
  }

  return true;
}
