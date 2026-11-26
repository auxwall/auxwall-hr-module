import { Model, ModelStatic, Op } from 'sequelize';
import { models } from '../../index';
import {
  assertStaffInCompany,
  asData,
  getAnnualLeaveWorkdays,
} from '../hrShared';

export async function getLeaveTypes(
  companyId: number,
  includeInactive = false,
) {
  return (models.leaveType as ModelStatic<Model>).findAll({
    where: {
      companyId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    order: [['name', 'ASC']],
  });
}

export async function saveLeaveType(data: any) {
  if (!data.name?.trim()) {
    throw new Error('Leave type name is required');
  }

  const entitlement = Number(data.annualEntitlementDays || 0);
  const carryover = Number(data.carryoverLimitDays || 0);

  if (entitlement < 0 || carryover < 0) {
    throw new Error('Leave entitlement and carryover must be zero or greater');
  }

  const weeklyOffDays = Array.isArray(data.weeklyOffDays)
    ? data.weeklyOffDays.map(Number)
    : [0, 6];

  if (
    weeklyOffDays.some(
      (day: number) => !Number.isInteger(day) || day < 0 || day > 6,
    )
  ) {
    throw new Error(
      'weeklyOffDays must contain weekday numbers from 0 to 6',
    );
  }

  const Type = models.leaveType as ModelStatic<Model>;
  const values: any = {
    name: data.name.trim(),
    annualEntitlementDays: entitlement,
    carryoverLimitDays: carryover,
    weeklyOffDays,
    isPaid: data.isPaid !== false,
    requiresDocument: !!data.requiresDocument,
    isActive: data.isActive !== false,
    updatedBy: data.userId,
  };

  if (data.id) {
    const row = await Type.findOne({
      where: {
        id: Number(data.id),
        companyId: Number(data.companyId),
      },
    });

    if (!row) {
      throw new Error('Leave type not found');
    }

    await row.update(values);
    return row;
  }

  return Type.create({
    ...values,
    companyId: Number(data.companyId),
    createdBy: data.userId,
  });
}

export async function disableLeaveType(
  companyId: number,
  id: number,
  userId: number,
) {
  const row = (await (
    models.leaveType as ModelStatic<Model>
  ).findOne({ where: { id, companyId } })) as any;

  if (!row) {
    throw new Error('Leave type not found');
  }

  await row.update({ isActive: false, updatedBy: userId });
  return true;
}

export async function getLeaveRequests(
  companyId: number,
  options: any = {},
) {
  const where: any = { companyId };

  if (options.staffId) {
    where.staffId = Number(options.staffId);
  }

  if (options.status) {
    where.status = options.status;
  }

  return (models.leaveRequest as ModelStatic<Model>).findAll({
    where,
    include: [{ model: models.leaveType, as: 'leaveType' }],
    order: [['startDate', 'DESC']],
  });
}

export async function saveLeaveRequest(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);

  await assertStaffInCompany(companyId, staffId);

  const Type = models.leaveType as ModelStatic<Model>;
  const type = (await Type.findOne({
    where: {
      id: Number(data.leaveTypeId),
      companyId,
      isActive: true,
    },
  })) as any;

  if (!type) {
    throw new Error('Select an active leave type');
  }

  if (
    !data.startDate ||
    !data.endDate ||
    data.endDate < data.startDate
  ) {
    throw new Error('Valid leave dates are required');
  }

  const requestedDays = await getAnnualLeaveWorkdays(
    companyId,
    data.startDate,
    data.endDate,
    type.weeklyOffDays || [0, 6],
  );

  if (!requestedDays) {
    throw new Error(
      'Selected dates contain no working days after weekends and public holidays',
    );
  }

  const Request = models.leaveRequest as ModelStatic<Model>;
  const overlap = await Request.findOne({
    where: {
      companyId,
      staffId,
      status: { [Op.in]: ['pending', 'approved'] },
      startDate: { [Op.lte]: data.endDate },
      endDate: { [Op.gte]: data.startDate },
      ...(data.id
        ? { id: { [Op.ne]: Number(data.id) } }
        : {}),
    },
  });

  if (overlap) {
    throw new Error(
      'Leave dates overlap another pending or approved request',
    );
  }

  const values: any = {
    leaveTypeId: type.id,
    startDate: data.startDate,
    endDate: data.endDate,
    requestedDays,
    reason: data.reason || null,
    attachmentKey: data.attachmentKey || null,
    updatedBy: data.userId,
  };

  if (data.id) {
    const where: any = {
      id: Number(data.id),
      companyId,
    };

    if (!data.isAdmin) {
      where.status = 'pending';
    }

    const row = (await Request.findOne({ where })) as any;

    if (!row) {
      throw new Error(
        data.isAdmin
          ? 'Leave request not found'
          : 'Approved or rejected leave requests cannot be modified by staff',
      );
    }

    await row.update(values);
    return row;
  }

  return Request.create({
    ...values,
    companyId,
    staffId,
    createdBy: data.userId,
  });
}

export async function reviewLeaveRequest(
  companyId: number,
  id: number,
  status: string,
  userId: number,
  reviewNotes?: string,
) {
  if (!['approved', 'rejected', 'cancelled'].includes(status)) {
    throw new Error('Invalid leave review status');
  }

  const row = (await (
    models.leaveRequest as ModelStatic<Model>
  ).findOne({ where: { id, companyId } })) as any;

  if (!row) {
    throw new Error('Leave request not found');
  }

  if (row.status !== 'pending' && status !== 'cancelled') {
    throw new Error('Only pending leave requests can be reviewed');
  }

  await row.update({
    status,
    reviewedBy: userId,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes || null,
    updatedBy: userId,
  });

  return row;
}

export async function getLeaveBalance(
  companyId: number,
  staffId: number,
  year = new Date().getFullYear(),
) {
  const staff = await assertStaffInCompany(companyId, staffId);
  const allRequests = (await (
    models.leaveRequest as ModelStatic<Model>
  ).findAll({
    where: {
      companyId,
      staffId,
      status: 'approved',
      startDate: { [Op.lte]: `${year}-12-31` },
      endDate: { [Op.gte]: `${year - 1}-01-01` },
    },
  })) as any[];

  const types = (await getLeaveTypes(companyId)) as any[];
  const joined = staff.joinDate
    ? new Date(`${staff.joinDate}T00:00:00Z`)
    : new Date(`${year - 1}-01-01T00:00:00Z`);

  const yearDates = (targetYear: number) => ({
    start: new Date(`${targetYear}-01-01T00:00:00Z`),
    end: new Date(`${targetYear}-12-31T00:00:00Z`),
  });

  const annualFraction = (targetYear: number) => {
    const { start, end } = yearDates(targetYear);
    const from = joined > start ? joined : start;

    return Math.max(
      0,
      Math.min(
        1,
        (end.getTime() - from.getTime() + 86400000) /
          (end.getTime() - start.getTime() + 86400000),
      ),
    );
  };

  const totals = new Map<number, { current: number; previous: number }>();

  for (const rawRequest of allRequests) {
    const request = asData(rawRequest);
    const leaveTypeId = Number(request.leaveTypeId);
    const stats = totals.get(leaveTypeId) || {
      current: 0,
      previous: 0,
    };
    const type = types
      .map(asData)
      .find((candidate: any) => Number(candidate.id) === leaveTypeId);

    if (!type) continue;

    const previousStart =
      request.startDate > `${year - 1}-01-01`
        ? request.startDate
        : `${year - 1}-01-01`;
    const previousEnd =
      request.endDate < `${year - 1}-12-31`
        ? request.endDate
        : `${year - 1}-12-31`;

    if (previousStart <= previousEnd) {
      stats.previous += await getAnnualLeaveWorkdays(
        companyId,
        previousStart,
        previousEnd,
        type.weeklyOffDays || [0, 6],
      );
    }

    const currentStart =
      request.startDate > `${year}-01-01`
        ? request.startDate
        : `${year}-01-01`;
    const currentEnd =
      request.endDate < `${year}-12-31`
        ? request.endDate
        : `${year}-12-31`;

    if (currentStart <= currentEnd) {
      stats.current += await getAnnualLeaveWorkdays(
        companyId,
        currentStart,
        currentEnd,
        type.weeklyOffDays || [0, 6],
      );
    }

    totals.set(leaveTypeId, stats);
  }

  return Promise.all(
    types.map(async rawType => {
      const type = asData(rawType);
      const used = totals.get(Number(type.id)) || {
        current: 0,
        previous: 0,
      };
      // Full year entitlement without pro-rating by join date
      const entitlementDays = Math.round(Number(type.annualEntitlementDays || 0));
      const previousEntitlement = Math.round(Number(type.annualEntitlementDays || 0));
      const carryoverDays = Math.round(Math.min(
        Math.max(0, previousEntitlement - used.previous),
        Number(type.carryoverLimitDays || 0),
      ));

      const usedDays = Math.round(Number(used.current || 0) * 2) / 2;
      const rawRemaining = entitlementDays + carryoverDays - usedDays;
      const remainingDays = Math.max(0, Math.round(rawRemaining * 2) / 2);
      const advanceDays = rawRemaining < 0 ? Math.round(Math.abs(rawRemaining) * 2) / 2 : 0;

      return {
        leaveTypeId: type.id,
        leaveType: type.name,
        year,
        entitlementDays,
        carryoverDays,
        usedDays,
        remainingDays,
        advanceDays,
        rawRemainingDays: Math.round(rawRemaining * 2) / 2,
      };
    }),
  );
}
