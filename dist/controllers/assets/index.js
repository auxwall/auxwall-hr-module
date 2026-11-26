"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAssetCategory = exports.saveAssetCategory = exports.getAssetCategories = exports.deleteCompanyAsset = exports.saveCompanyAsset = exports.getCompanyAssets = void 0;
const index_1 = require("../../index");
const hrShared_1 = require("../hrShared");
// ─── Company Assets ─────────────────────────────────────────────────────────
async function getCompanyAssets(companyId, query = {}) {
    const Asset = index_1.models.companyAsset;
    if (!Asset) {
        throw new Error('Company Asset model is not initialized');
    }
    const where = { companyId };
    if (query.staffId) {
        where.staffId = Number(query.staffId);
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.assetCategory) {
        where.assetCategory = query.assetCategory;
    }
    const assets = await Asset.findAll({
        where,
        order: [
            ['assignedDate', 'DESC'],
            ['id', 'DESC'],
        ],
    });
    return assets.map(hrShared_1.asData);
}
exports.getCompanyAssets = getCompanyAssets;
async function saveCompanyAsset(data) {
    const companyId = Number(data.companyId);
    const staffId = Number(data.staffId);
    if (!companyId) {
        throw new Error('Company ID is required');
    }
    if (!staffId) {
        throw new Error('Staff ID is required');
    }
    if (!data.assetName || !data.assetName.trim()) {
        throw new Error('Asset Name is required');
    }
    await (0, hrShared_1.assertStaffInCompany)(companyId, staffId);
    const Asset = index_1.models.companyAsset;
    if (!Asset) {
        throw new Error('Company Asset model is not initialized');
    }
    const fields = [
        'staffId',
        'assetName',
        'assetCategory',
        'assetTag',
        'serialNumber',
        'assignedDate',
        'returnDate',
        'condition',
        'status',
        'notes',
    ];
    const values = {};
    for (const key of fields) {
        if (data[key] !== undefined) {
            values[key] = data[key];
        }
    }
    let asset;
    if (data.id) {
        asset = await Asset.findOne({
            where: {
                id: Number(data.id),
                companyId,
            },
        });
        if (!asset) {
            throw new Error('Company Asset not found');
        }
        await asset.update({
            ...values,
            updatedBy: data.userId,
        });
    }
    else {
        asset = await Asset.create({
            companyId,
            ...values,
            createdBy: data.userId,
            updatedBy: data.userId,
        });
    }
    return (0, hrShared_1.asData)(asset);
}
exports.saveCompanyAsset = saveCompanyAsset;
async function deleteCompanyAsset(companyId, id) {
    const Asset = index_1.models.companyAsset;
    if (!Asset) {
        throw new Error('Company Asset model is not initialized');
    }
    const count = await Asset.destroy({
        where: { companyId, id: Number(id) },
    });
    if (!count) {
        throw new Error('Company Asset not found');
    }
    return true;
}
exports.deleteCompanyAsset = deleteCompanyAsset;
// ─── Asset Categories ───────────────────────────────────────────────────────
async function getAssetCategories(companyId) {
    const Category = index_1.models.assetCategory;
    if (!Category) {
        throw new Error('Asset Category model is not initialized');
    }
    const categories = await Category.findAll({
        where: { companyId: Number(companyId) },
        order: [['name', 'ASC']],
    });
    return categories.map(hrShared_1.asData);
}
exports.getAssetCategories = getAssetCategories;
async function saveAssetCategory(data) {
    const companyId = Number(data.companyId);
    const name = String(data.name || '').trim();
    if (!companyId) {
        throw new Error('Company ID is required');
    }
    if (!name) {
        throw new Error('Category name is required');
    }
    const Category = index_1.models.assetCategory;
    if (!Category) {
        throw new Error('Asset Category model is not initialized');
    }
    // Check if category with same name already exists for this company
    let existing = await Category.findOne({
        where: { companyId, name },
    });
    if (existing) {
        if (data.id && Number(existing.id) !== Number(data.id)) {
            throw new Error('Category with this name already exists');
        }
        if (data.description !== undefined) {
            await existing.update({
                description: data.description,
                updatedBy: data.userId,
            });
        }
        return (0, hrShared_1.asData)(existing);
    }
    if (data.id) {
        existing = await Category.findOne({
            where: { companyId, id: Number(data.id) },
        });
        if (!existing) {
            throw new Error('Asset category not found');
        }
        await existing.update({
            name,
            description: data.description,
            updatedBy: data.userId,
        });
        return (0, hrShared_1.asData)(existing);
    }
    const created = await Category.create({
        companyId,
        name,
        description: data.description || null,
        createdBy: data.userId,
        updatedBy: data.userId,
    });
    return (0, hrShared_1.asData)(created);
}
exports.saveAssetCategory = saveAssetCategory;
async function deleteAssetCategory(companyId, id) {
    const Category = index_1.models.assetCategory;
    if (!Category) {
        throw new Error('Asset Category model is not initialized');
    }
    const count = await Category.destroy({
        where: { companyId: Number(companyId), id: Number(id) },
    });
    if (!count) {
        throw new Error('Asset Category not found');
    }
    return true;
}
exports.deleteAssetCategory = deleteAssetCategory;
