"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployeeTask = exports.saveEmployeeTask = exports.getEmployeeTasks = exports.getEmployeeHistory = exports.updateLifecycleStatus = exports.saveEmployeeProfile = exports.getEmployeeProfile = exports.getEmployeeProfiles = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("../../index");
const hrShared_1 = require("../hrShared");
async function getEmployeeProfiles(companyId) {
    const Staff = index_1.models.staff;
    const sequelize = Staff.sequelize;
    const relation = sequelize.models['user_Company_Relation'] ||
        sequelize.models['userCompanyRelation'] ||
        sequelize.models['company_user_relations'];
    if (!relation) {
        throw new Error('Company membership model is not initialized');
    }
    const memberships = (await relation.findAll({
        where: { companyId },
        attributes: ['userId'],
        raw: true,
    }));
    const ids = memberships.map(membership => Number(membership.userId));
    const staff = ids.length
        ? await Staff.findAll({
            where: { id: { [sequelize_1.Op.in]: ids } },
            order: [['fullName', 'ASC']],
        })
        : [];
    const profiles = await index_1.models.employeeProfile.findAll({ where: { companyId } });
    const profilesByStaffId = new Map(profiles.map(profile => [
        Number((0, hrShared_1.asData)(profile).staffId),
        (0, hrShared_1.asData)(profile),
    ]));
    return staff.map(person => ({
        ...(0, hrShared_1.asData)(person),
        hrProfile: profilesByStaffId.get(Number((0, hrShared_1.asData)(person).id)) || null,
    }));
}
exports.getEmployeeProfiles = getEmployeeProfiles;
async function getEmployeeProfile(companyId, staffId) {
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const profile = await index_1.models.employeeProfile.findOne({
        where: { companyId, staffId },
        include: index_1.models.staff ? [{
                model: index_1.models.staff,
                as: 'manager',
                attributes: ['id', 'fullName', 'userName', 'designation']
            }] : []
    });
    return (0, hrShared_1.asData)(profile);
}
exports.getEmployeeProfile = getEmployeeProfile;
async function saveEmployeeProfile(data) {
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    await (0, hrShared_1.assertManagerInCompany)(companyId, data.managerId);
    const Profile = index_1.models.employeeProfile;
    const History = index_1.models.employeeHistory;
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
    const values = {};
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
            }
            catch {
                contacts = null;
            }
        }
        if (Array.isArray(contacts)) {
            values.emergencyContacts = JSON.stringify(contacts);
            if (contacts.length > 0 && contacts[0]) {
                values.emergencyContactName = contacts[0].name || values.emergencyContactName;
                values.emergencyContactPhone = contacts[0].phone || values.emergencyContactPhone;
            }
        }
        else if (data.emergencyContacts === null || data.emergencyContacts === '') {
            values.emergencyContacts = null;
        }
    }
    const existing = await Profile.findOne({
        where: { companyId, staffId },
    });
    const sequelize = Profile.sequelize;
    const transaction = await sequelize.transaction();
    try {
        let saved;
        if (existing) {
            const before = (0, hrShared_1.asData)(existing);
            const changed = {};
            for (const key of Object.keys(values)) {
                if (before[key] !== values[key]) {
                    changed[key] = { from: before[key], to: values[key] };
                }
            }
            saved = await existing.update({ ...values, updatedBy: data.userId }, { transaction });
            if (Object.keys(changed).length) {
                await History.create({
                    companyId,
                    staffId,
                    eventType: 'profile-updated',
                    changes: changed,
                    createdBy: data.userId,
                }, { transaction });
            }
        }
        else {
            saved = await Profile.create({
                companyId,
                staffId,
                ...values,
                createdBy: data.userId,
                updatedBy: data.userId,
            }, { transaction });
            const activeValues = {};
            for (const [k, v] of Object.entries(values)) {
                if (v !== null && v !== undefined && v !== '') {
                    activeValues[k] = v;
                }
            }
            await History.create({
                companyId,
                staffId,
                eventType: 'profile-created',
                changes: activeValues,
                createdBy: data.userId,
            }, { transaction });
        }
        await transaction.commit();
        return (0, hrShared_1.asData)(saved);
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
}
exports.saveEmployeeProfile = saveEmployeeProfile;
async function updateLifecycleStatus(companyId, staffId, lifecycleStatus, userId, lastWorkingDate) {
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
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const Profile = index_1.models.employeeProfile;
    const History = index_1.models.employeeHistory;
    const profile = await Profile.findOne({
        where: { companyId, staffId },
    });
    if (!profile) {
        throw new Error('Create the employee HR profile before changing lifecycle status');
    }
    const prior = profile.lifecycleStatus;
    const values = { lifecycleStatus, updatedBy: userId };
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
    return (0, hrShared_1.asData)(profile);
}
exports.updateLifecycleStatus = updateLifecycleStatus;
async function getEmployeeHistory(companyId, staffId) {
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    return index_1.models.employeeHistory.findAll({
        where: { companyId, staffId },
        order: [['createdAt', 'DESC']],
    });
}
exports.getEmployeeHistory = getEmployeeHistory;
async function getEmployeeTasks(companyId, phase = 'work', staffId) {
    const targetPhase = phase || 'work';
    if (staffId) {
        await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    }
    return index_1.models.employeeTask.findAll({
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
exports.getEmployeeTasks = getEmployeeTasks;
async function saveEmployeeTask(data) {
    var _a;
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const phase = data.phase || 'work';
    const Task = index_1.models.employeeTask;
    const fields = [
        'staffId',
        'title',
        'description',
        'assignedTo',
        'dueDate',
        'status',
        'notes',
    ];
    const values = {};
    for (const key of fields) {
        if (data[key] !== undefined) {
            values[key] = data[key];
        }
    }
    if (values.status === 'completed') {
        values.completedAt = new Date();
    }
    else if (values.status) {
        values.completedAt = null;
    }
    let task;
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
    }
    else {
        if (!((_a = values.title) === null || _a === void 0 ? void 0 : _a.trim())) {
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
    return (0, hrShared_1.asData)(task);
}
exports.saveEmployeeTask = saveEmployeeTask;
async function deleteEmployeeTask(companyId, id) {
    const count = await index_1.models.employeeTask.destroy({ where: { companyId, id } });
    if (!count) {
        throw new Error('Task not found');
    }
    return true;
}
exports.deleteEmployeeTask = deleteEmployeeTask;
