import { Model, ModelStatic } from 'sequelize';
import { models } from '../../index';
import { assertStaffInCompany } from '../hrShared';

const roundMoney = (value: number) => Number(value.toFixed(2));

interface GratuityInput {
  joiningDate: string;
  lastWorkingDate: string;
  lastBasicWage: number;
  unpaidAbsenceDays?: number;
}

export function calculateUaeFullTimeExpatriateGratuity(
  input: GratuityInput,
) {
  const joining = new Date(`${input.joiningDate}T00:00:00Z`);
  const lastWorking = new Date(`${input.lastWorkingDate}T00:00:00Z`);

  if (
    !Number.isFinite(joining.getTime()) ||
    !Number.isFinite(lastWorking.getTime()) ||
    lastWorking < joining
  ) {
    throw new Error('Valid joining and last working dates are required');
  }

  if (!Number.isFinite(input.lastBasicWage) || input.lastBasicWage <= 0) {
    throw new Error('Last basic wage must be greater than zero');
  }

  const grossServiceDays =
    Math.floor((lastWorking.getTime() - joining.getTime()) / 86400000) + 1;
  const unpaidAbsenceDays = Math.max(
    0,
    Number(input.unpaidAbsenceDays || 0),
  );

  if (unpaidAbsenceDays > grossServiceDays) {
    throw new Error('Unpaid absence days cannot exceed the service period');
  }

  const serviceDays = grossServiceDays - unpaidAbsenceDays;
  const serviceYears = serviceDays / 365;
  const gratuityDays =
    serviceYears < 1
      ? 0
      : Math.min(
          21 * Math.min(serviceYears, 5) +
            30 * Math.max(serviceYears - 5, 0),
          720,
        );
  const gratuityAmount = roundMoney(
    (input.lastBasicWage / 30) * gratuityDays,
  );

  return {
    grossServiceDays,
    serviceDays: Number(serviceDays.toFixed(2)),
    serviceYears: Number(serviceYears.toFixed(6)),
    gratuityDays: Number(gratuityDays.toFixed(4)),
    gratuityAmount,
  };
}

export async function getFinalSettlements(
  companyId: number,
  options: any = {},
) {
  return (models.finalSettlement as ModelStatic<Model>).findAll({
    where: {
      companyId,
      ...(options.staffId ? { staffId: Number(options.staffId) } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    order: [['createdAt', 'DESC']],
  });
}

export async function createFinalSettlementEstimate(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);
  const staff = await assertStaffInCompany(companyId, staffId);
  const profile = (await (
    models.employeeProfile as ModelStatic<Model>
  ).findOne({ where: { companyId, staffId } })) as any;

  const employmentType = profile?.employmentType || 'full-time';
  const workerCategory = profile?.workerCategory || 'expatriate';
  const endOfServiceScheme = profile?.endOfServiceScheme || 'standard';

  if (employmentType !== 'full-time') {
    throw new Error('Calculator supports full-time employees only');
  }

  if (workerCategory !== 'expatriate') {
    throw new Error(
      'Calculator supports expatriate employees only; apply the relevant pension rules to other categories',
    );
  }

  if (endOfServiceScheme !== 'standard') {
    throw new Error(
      'Alternative end-of-service savings schemes are not covered by this calculator',
    );
  }

  const joiningDate = data.joiningDate || staff.joinDate;
  const lastWorkingDate = data.lastWorkingDate || profile.lastWorkingDate;

  if (!joiningDate || !lastWorkingDate) {
    throw new Error('Joining date and last working date are required');
  }

  const lastBasicWage = Number(data.lastBasicWage);
  const unpaidAbsenceDays = Number(data.unpaidAbsenceDays || 0);
  const result = calculateUaeFullTimeExpatriateGratuity({
    joiningDate,
    lastWorkingDate,
    lastBasicWage,
    unpaidAbsenceDays,
  });

  const leaveEncashmentAmount = roundMoney(
    Number(data.leaveEncashmentAmount || 0),
  );
  const otherAdditions = roundMoney(Number(data.otherAdditions || 0));
  const deductions = roundMoney(Number(data.deductions || 0));

  if (
    [leaveEncashmentAmount, otherAdditions, deductions].some(
      amount => !Number.isFinite(amount) || amount < 0,
    )
  ) {
    throw new Error('Settlement additions and deductions must be zero or greater');
  }

  const netSettlementEstimate = roundMoney(
    result.gratuityAmount +
      leaveEncashmentAmount +
      otherAdditions -
      deductions,
  );
  const calculationBreakdown = {
    jurisdiction: 'UAE private sector',
    employeeCategory: 'expatriate full-time',
    endOfServiceScheme: 'standard gratuity',
    wageBasis: 'last basic wage',
    rule: '21 days per service year for the first five years; 30 days per additional service year; maximum 24 months basic wage; no entitlement before one year',
    ...result,
    lastBasicWage,
    leaveEncashmentAmount,
    otherAdditions,
    deductions,
    netSettlementEstimate,
    disclaimer:
      'Estimate for HR review. Confirm current legal applicability, employee records, and deductions before approval.',
  };

  return (models.finalSettlement as ModelStatic<Model>).create({
    companyId,
    staffId,
    calculationDate: new Date().toISOString().slice(0, 10),
    joiningDate,
    lastWorkingDate,
    lastBasicWage,
    unpaidAbsenceDays,
    serviceDays: result.serviceDays,
    gratuityDays: result.gratuityDays,
    gratuityAmount: result.gratuityAmount,
    leaveEncashmentAmount,
    otherAdditions,
    deductions,
    netSettlementEstimate,
    calculationBreakdown,
    createdBy: data.userId,
  });
}

export async function updateFinalSettlementStatus(
  companyId: number,
  id: number,
  status: string,
  userId: number,
  notes?: string,
) {
  const row = (await (
    models.finalSettlement as ModelStatic<Model>
  ).findOne({ where: { id, companyId } })) as any;

  if (!row) {
    throw new Error('Final settlement not found');
  }

  const allowed: Record<string, string[]> = {
    draft: ['reviewed'],
    reviewed: ['approved', 'draft'],
    approved: ['closed'],
  };

  if (!allowed[row.status]?.includes(status)) {
    throw new Error(
      `Cannot change settlement from ${row.status} to ${status}`,
    );
  }

  const values: any = { status, notes: notes ?? row.notes };

  if (status === 'reviewed') {
    values.reviewedBy = userId;
  }

  if (status === 'approved') {
    values.approvedBy = userId;
  }

  await row.update(values);
  return row;
}
