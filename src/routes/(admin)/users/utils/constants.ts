import type { UserRole } from '$lib/types/index.js';


export function getRoleBadgeStyles( role: UserRole ): string {
    switch ( role ) {
        case 'SUPER_ADMIN':
            return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'ADMIN':
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'STAFF':
            return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'MEMBER':
            return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        default:
            return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
}


export function getRoleLabel( role: UserRole ): string {
    switch ( role ) {
        case 'SUPER_ADMIN':
            return 'Súper Admin';
        case 'ADMIN':
            return 'Administrador';
        case 'STAFF':
            return 'Personal (Staff)';
        case 'MEMBER':
            return 'Miembro';
        default:
            return role;
    }
}


const basicRoles = [
    { value: 'SUPER_ADMIN', label: 'Súper Admin' },
	{ value: 'ADMIN',       label: 'Administrador' },
	{ value: 'STAFF',       label: 'Personal (Staff)' },
	{ value: 'MEMBER',      label: 'Miembro' }
]


export const roleOptions = [
	{ value: 'ALL', label: 'Todos los roles' },
    ...basicRoles
];


export function getFilteredRoleOptions( currentUserRole: string | null ) {
    if ( currentUserRole === 'ADMIN' ) {
        return [
			{ value: 'STAFF',  label: 'Personal (Staff)' },
			{ value: 'MEMBER', label: 'Miembro Familiar' }
		]
    }

    return [ ...basicRoles ];
}
