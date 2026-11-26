import { Model, ModelStatic, Op } from 'sequelize';
import { models } from '../../index';
import {
  assertManagerInCompany,
  assertStaffInCompany,
  asData,
} from '../hrShared';

export async function getEmployeeProfiles(companyId: number) {
  const Staff = models.staff as ModelStatic<Model>;
  const sequelize = Staff.sequelize!;
  const relation =
    sequelize.models['user_Company_Relation'] ||
    sequelize.models['userCompanyRelation'] ||
    sequelize.models['company_user_relations'];

  if (!relation) {
    throw new Error('Company membership model is not initialized');
  }

  const memberships = (await relation.findAll({
    where: { companyId },
    attributes: ['userId'],
    raw: true,
  })) as any[];
  const ids = memberships.map(membership => Number(membership.userId));
  const staff = ids.length
    ? await Staff.findAll({
        where: { id: { [Op.in]: ids } },
        order: [['fullName', 'ASC']],
      })
    : [];
  const profiles = await (
    models.employeeProfile as ModelStatic<Model>
  ).findAll({ where: { companyId } });
  const profilesByStaffId = new Map(
    (profiles as any[]).map(profile => [
      Number(asData(profile).staffId),
      asData(profile),
    ]),
  );

  return (staff as any[]).map(person => ({
    ...asData(person),
    hrProfile: profilesByStaffId.get(Number(asData(person).id)) || null,
  }));
}

export async function getEmployeeProfile(
  companyId: number,
  staffId: number,
) {
  await assertStaffInCompany(companyId, staffId);

  const profile = await (
    models.employeeProfile as ModelStatic<Model>
  ).findOne({
    where: { companyId, staffId },
    include: models.staff ? [{
      model: models.staff as ModelStatic<Model>,
      as: 'manager',
      attributes: ['id', 'fullName', 'userName', 'designation']
    }] : []
  });

  return asData(profile);
}

export async function saveEmployeeProfile(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);

  await assertStaffInCompany(companyId, staffId);
  await assertManagerInCompany(companyId, data.managerId);

  const Profile = models.employeeProfile as ModelStatic<Model>;
  const History = models.employeeHistory as ModelStatic<Model>;
  const fields = [
    'employeeNo',
    'managerId',
    'employmentType',
    'workerCategory',
    'endOfServiceScheme',
    'workLocation',
    'lifecycleStatus',
    'contractStartDate',
    'contractEndDate',
    'probationEndDate',
    'lastWorkingDate',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContacts',
  ];
  const values: any = {};

  for (const key of fields) {
    if (data[key] !== undefined) {
      values[key] = data[key] === '' ? null : data[key];
    }
  }

  if (data.emergencyContacts !== undefined) {
    let contacts = data.emergencyContacts;
    if (typeof contacts === 'string') {
      try {
        contacts = JSON.parse(contacts);
      } catch {
        contacts = null;
      }
    }
    if (Array.isArray(contacts)) {
      values.emergencyContacts = JSON.stringify(contacts);
      if (contacts.length > 0 && contacts[0]) {
        values.emergencyContactName = contacts[0].name || values.emergencyContactName;
        values.emergencyContactPhone = contacts[0].phone || values.emergencyContactPhone;
      }
    } else if (data.emergencyContacts === null || data.emergencyContacts === '') {
      values.emergencyContacts = null;
    }
  }

  const existing = await Profile.findOne({
    where: { companyId, staffId },
  });
  const sequelize = Profile.sequelize!;
  const transaction = await sequelize.transaction();

  try {
    let saved: any;

    if (existing) {
      const before = asData(existing);
      const changed: any = {};

      for (const key of Object.keys(values)) {
        if (before[key] !== values[key]) {
          changed[key] = { from: before[key], to: values[key] };
        }
      }

      saved = await existing.update(
        { ...values, updatedBy: data.userId },
        { transaction },
      );

      if (Object.keys(changed).length) {
        await History.create(
          {
            companyId,
            staffId,
            eventType: 'profile-updated',
            changes: changed,
            createdBy: data.userId,
          },
          { transaction },
        );
      }
    } else {
      saved = await Profile.create(
        {
          companyId,
          staffId,
          ...values,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        { transaction },
      );

      const activeValues: any = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== null && v !== undefined && v !== '') {
          activeValues[k] = v;
        }
      }

      await History.create(
        {
          companyId,
          staffId,
          eventType: 'profile-created',
          changes: activeValues,
          createdBy: data.userId,
        },
        { transaction },
      );
    }

    await transaction.commit();
    return asData(saved);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateLifecycleStatus(
  companyId: number,
  staffId: number,
  lifecycleStatus: string,
  userId: number,
  lastWorkingDate?: string,
) {
  const allowed = [
    'pre-hire',
    'active',
    'on-leave',
    'notice-period',
    'separated',
  ];

  if (!allowed.includes(lifecycleStatus)) {
    throw new Error('Invalid employee lifecycle status');
  }

  await assertStaffInCompany(companyId, staffId);

  const Profile = models.employeeProfile as ModelStatic<Model>;
  const History = models.employeeHistory as ModelStatic<Model>;
  const profile: any = await Profile.findOne({
    where: { companyId, staffId },
  });

  if (!profile) {
    throw new Error(
      'Create the employee HR profile before changing lifecycle status',
    );
  }

  const prior = profile.lifecycleStatus;
  const values: any = { lifecycleStatus, updatedBy: userId };

  if (lastWorkingDate) {
    values.lastWorkingDate = lastWorkingDate;
  }

  await profile.update(values);
  await History.create({
    companyId,
    staffId,
    eventType: 'lifecycle-status-changed',
    changes: {
      lifecycleStatus: { from: prior, to: lifecycleStatus },
      ...(lastWorkingDate ? { lastWorkingDate } : {}),
    },
    createdBy: userId,
  });

  return asData(profile);
}

export async function getEmployeeHistory(
  companyId: number,
  staffId: number,
) {
  await assertStaffInCompany(companyId, staffId);

  return (models.employeeHistory as ModelStatic<Model>).findAll({
    where: { companyId, staffId },
    order: [['createdAt', 'DESC']],
  });
}

export async function getEmployeeTasks(
  companyId: number,
  phase: string = 'work',
  staffId?: number,
) {
  const targetPhase = phase || 'work';

  if (staffId) {
    await assertStaffInCompany(companyId, staffId);
  }

  return (models.employeeTask as ModelStatic<Model>).findAll({
    where: {
      companyId,
      phase: targetPhase,
      ...(staffId ? { staffId } : {}),
    },
    order: [
      ['dueDate', 'ASC'],
      ['id', 'DESC'],
    ],
  });
}

export async function saveEmployeeTask(data: any) {
  const companyId = Number(data.companyId);
  const staffId = Number(data.staffId);

  await assertStaffInCompany(companyId, staffId);

  const phase = data.phase || 'work';

  const Task = models.employeeTask as ModelStatic<Model>;
  const fields = [
    'staffId',
    'title',
    'description',
    'assignedTo',
    'dueDate',
    'status',
    'notes',
  ];
  const values: any = {};

  for (const key of fields) {
    if (data[key] !== undefined) {
      values[key] = data[key];
    }
  }

  if (values.status === 'completed') {
    values.completedAt = new Date();
  } else if (values.status) {
    values.completedAt = null;
  }

  let task: any;

  if (data.id) {
    task = await Task.findOne({
      where: {
        id: Number(data.id),
        companyId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await task.update({ ...values, updatedBy: data.userId });
  } else {
    if (!values.title?.trim()) {
      throw new Error('Task title is required');
    }

    task = await Task.create({
      companyId,
      staffId,
      phase,
      ...values,
      createdBy: data.userId,
      updatedBy: data.userId,
    });
  }

  return asData(task);
}

export async function deleteEmployeeTask(companyId: number, id: number) {
  const count = await (
    models.employeeTask as ModelStatic<Model>
  ).destroy({ where: { companyId, id } });

  if (!count) {
    throw new Error('Task not found');
  }

  return true;
}
