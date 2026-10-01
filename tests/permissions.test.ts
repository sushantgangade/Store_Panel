import { describe, it, expect } from 'vitest';
import { can } from '@/lib/permissions';

describe('permissions', () => {
    it('admin can delete', () => expect(can('ADMIN', 'canDeleteProduct')).toBe(true));
    it('manager cannot delete', () => expect(can('MANAGER', 'canDeleteProduct')).toBe(false));
    it('manager can edit', () => expect(can('MANAGER', 'canEditProduct')).toBe(true));
    it('undefined role cannot act', () => expect(can(undefined, 'canEditProduct')).toBe(false));
});