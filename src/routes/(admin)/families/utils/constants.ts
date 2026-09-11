import type { FamilyMemberRole } from '$lib/types/index.js';

export const orgOptions = [
	{ value : 'NINGUNA',         label : 'Ninguna' },
	{ value : 'CUORUM',          label : 'Cuórum' },
	{ value : 'SOC_SOC',         label : 'Soc. Socorro' },
	{ value : 'HOMBRES_JOVENES', label : 'Hombres Jóvenes' },
	{ value : 'MUJERES_JOVENES', label : 'Mujeres Jóvenes' },
	{ value : 'PRIMARIA',        label : 'Primaria' },
	{ value : 'FRIENDS',         label : 'Amigos' }
];

export const familyRoleOptions = [
	{ value : 'VIEWER',     label : 'Lector / Visualizador' },
	{ value : 'AGGREGATOR', label : 'Agregador de Miembros' },
	{ value : 'ADMIN',      label : 'Administrador del Grupo' }
];

export function getOrgLabel( org: string ): string {
	switch ( org ) {
		case 'CUORUM':
			return 'Cuórum';
		case 'SOC_SOC':
			return 'Soc. Socorro';
		case 'HOMBRES_JOVENES':
			return 'Hombres Jóvenes';
		case 'MUJERES_JOVENES':
			return 'Mujeres Jóvenes';
		case 'PRIMARIA':
			return 'Primaria';
		case 'FRIENDS':
			return 'Amigos';
		case 'NINGUNA':
		default:
			return 'Ninguna';
	}
}

export function getFamilyRoleLabel( role?: FamilyMemberRole | string ): string {
	switch ( role ) {
		case 'ADMIN':
			return 'Administrador';
		case 'AGGREGATOR':
			return 'Agregador';
		case 'VIEWER':
		default:
			return 'Lector';
	}
}

export function getFamilyRoleBadgeStyles( role?: FamilyMemberRole | string ): string {
	switch ( role ) {
		case 'ADMIN':
			return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
		case 'AGGREGATOR':
			return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
		case 'VIEWER':
		default:
			return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
	}
}
