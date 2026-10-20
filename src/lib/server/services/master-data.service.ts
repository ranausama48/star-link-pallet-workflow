import { prisma } from '@/lib/server/prisma';
import { genId } from '@/lib/server/gen-id';
import type { ServiceResponse } from '@/lib/server/route-config';

export async function createPalletType(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color } = body;
  if (!code || !name) {
    return { status: 400, body: { error: 'Code and name are required' } };
  }

  const newPalletType = await prisma.palletType.create({
    data: {
      id: genId('PLT'),
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      material: material ? String(material) : 'Wood',
      lengthCm: Number(lengthCm) || 120,
      widthCm: Number(widthCm) || 100,
      heightCm: Number(heightCm) || 15,
      tareWeightKg: Number(tareWeightKg) || 20,
      maxLoadKg: Number(maxLoadKg) || 1500,
      color: color ? String(color) : '#16A34A',
      status: 'ACTIVE',
    },
  });

  return { status: 200, body: { success: true, palletType: newPalletType } };
}

export async function updatePalletType(id: string, body: Record<string, unknown>): Promise<ServiceResponse> {
  const existing = await prisma.palletType.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Pallet type not found' } };
  }

  const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color, status } = body;
  const updated = await prisma.palletType.update({
    where: { id },
    data: {
      ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(material !== undefined ? { material: String(material) } : {}),
      ...(lengthCm !== undefined ? { lengthCm: Number(lengthCm) } : {}),
      ...(widthCm !== undefined ? { widthCm: Number(widthCm) } : {}),
      ...(heightCm !== undefined ? { heightCm: Number(heightCm) } : {}),
      ...(tareWeightKg !== undefined ? { tareWeightKg: Number(tareWeightKg) } : {}),
      ...(maxLoadKg !== undefined ? { maxLoadKg: Number(maxLoadKg) } : {}),
      ...(color !== undefined ? { color: String(color) } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    },
  });

  return { status: 200, body: { success: true, palletType: updated } };
}

export async function deletePalletType(id: string): Promise<ServiceResponse> {
  const pallet = await prisma.palletType.findUnique({ where: { id } });
  if (!pallet) {
    return { status: 404, body: { error: 'Pallet type not found' } };
  }

  const inUse = await prisma.palletTransaction.findFirst({ where: { palletTypeId: id } });
  if (inUse) {
    return {
      status: 400,
      body: {
        error: `Cannot delete "${pallet.name}" (${pallet.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      },
    };
  }

  await prisma.palletType.delete({ where: { id } });
  return { status: 200, body: { success: true, message: `Pallet type "${pallet.name}" has been deleted.` } };
}

export async function createDocRefType(body: Record<string, unknown>): Promise<ServiceResponse> {
  const { code, name, description, status } = body;
  if (!code || !name) {
    return { status: 400, body: { error: 'Code and name are required' } };
  }

  const newDocRefType = await prisma.docRefType.create({
    data: {
      id: genId('REF'),
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
  });

  return { status: 200, body: { success: true, docRefType: newDocRefType } };
}

export async function updateDocRefType(id: string, body: Record<string, unknown>): Promise<ServiceResponse> {
  const existing = await prisma.docRefType.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Doc ref type not found' } };
  }

  const { code, name, description, status } = body;
  const updated = await prisma.docRefType.update({
    where: { id },
    data: {
      ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(description !== undefined ? { description: String(description).trim() } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    },
  });

  return { status: 200, body: { success: true, docRefType: updated } };
}

export async function deleteDocRefType(id: string): Promise<ServiceResponse> {
  const docRef = await prisma.docRefType.findUnique({ where: { id } });
  if (!docRef) {
    return { status: 404, body: { error: 'Doc ref type not found' } };
  }

  const inUse = await prisma.palletTransaction.findFirst({ where: { docRefTypeId: id } });
  if (inUse) {
    return {
      status: 400,
      body: {
        error: `Cannot delete "${docRef.name}" (${docRef.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      },
    };
  }

  await prisma.docRefType.delete({ where: { id } });
  return { status: 200, body: { success: true, message: `Doc ref type "${docRef.name}" has been deleted.` } };
}
