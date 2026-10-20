import type { UserRole } from '@/types';

export function defaultPermissionsForRole(role: UserRole): Record<string, string> {
  return {
    pallet_inbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
    pallet_outbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
    analytics_soh: 'view',
    analytics_ib: 'view',
    analytics_ob: 'view',
    analytics_visuals: 'view',
    admin_users: role === 'Admin' ? 'all' : 'none',
    admin_faco: role === 'Admin' ? 'all' : role === 'Management' ? 'view' : 'none',
    admin_pallets: role === 'Admin' ? 'all' : role === 'Management' ? 'view' : 'none',
    admin_docref: role === 'Admin' ? 'all' : role === 'Management' ? 'view' : 'none',
    admin_oracle: role === 'Admin' ? 'all' : 'none',
  };
}

export const REGISTER_DEFAULT_PERMISSIONS = {
  pallet_inbound: 'edit',
  pallet_outbound: 'edit',
  analytics_soh: 'view',
  analytics_ib: 'view',
  analytics_ob: 'view',
  analytics_visuals: 'view',
  admin_users: 'none',
  admin_faco: 'none',
  admin_pallets: 'none',
  admin_docref: 'none',
  admin_oracle: 'none',
} as const;
