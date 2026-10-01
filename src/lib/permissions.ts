import type { Role } from '@prisma/client';

export const PERMISSIONS = {
    ADMIN: {
        canViewProducts: true,
        canCreateProduct: true,
        canEditProduct: true,
        canDeleteProduct: true,
        canChangeStatus: true,
    },
    MANAGER: {
        canViewProducts: true,
        canCreateProduct: true,
        canEditProduct: true,
        canDeleteProduct: false,
        canChangeStatus: true,
    },
} as const;

export type Permission = keyof (typeof PERMISSIONS)['ADMIN'];

export function can(role: Role | undefined, permission: Permission): boolean {
    if (!role) return false;
    return PERMISSIONS[role][permission];
}