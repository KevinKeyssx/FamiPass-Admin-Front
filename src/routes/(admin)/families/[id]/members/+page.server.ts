import { fail } from '@sveltejs/kit';

import {
    getFamilyMembers,
	createFamilyMember,
	updateFamilyMember,
	deleteFamilyMember
}                                       from '$lib/server/supabase/services/familyMembers.service.js';
import type {
    FamilyMember,
	CommunityOrganization,
	FamilyMemberRole
}                                       from '$lib/types/index.js';
import { getFamilyById }                from '$lib/server/supabase/services/families.service.js';
import type { PageServerLoad, Actions } from './$types.js';


export const load: PageServerLoad = async ( { params, depends } ) => {
	depends( 'app:family-members' );

	try {
		const family  = await getFamilyById( params.id );
		const members = await getFamilyMembers( params.id );

		return {
			family,
			members
		};
	} catch ( err: any ) {
		return {
			family  : null,
			members : [],
			error   : err.message
		};
	}
};

export const actions: Actions = {
	save: async ( { params, request, url } ) => {
		const memberId = url.searchParams.get( 'memberId' );
		const formData = await request.formData();

		const fullName         = formData.get( 'full_name' ) as string;
		const rut              = formData.get( 'rut' ) as string;
		const email            = formData.get( 'email' ) as string;
		const phone            = formData.get( 'phone' ) as string;
		const organization     = formData.get( 'organization' ) as CommunityOrganization;
		const isRepresentative = formData.get( 'is_representative' ) === 'true';
		const role             = ( formData.get( 'role' ) as FamilyMemberRole ) || ( isRepresentative ? 'ADMIN' : 'VIEWER' );

		if ( !fullName || !fullName.trim() ) {
			return fail( 400, { error: 'El nombre completo es requerido.' } );
		}

		if ( !rut || !rut.trim() ) {
			return fail( 400, { error: 'El RUT es requerido.' } );
		}

		try {
			if ( memberId ) {
				const memberData: Partial<Omit<FamilyMember, 'id' | 'family_id' | 'created_at' | 'updated_at' | 'family'>> = {
					full_name         : fullName.trim(),
					rut               : rut.trim(),
					email             : email ? email.trim() : null,
					phone             : phone ? phone.trim() : null,
					organization      : organization,
					is_representative : isRepresentative,
					role              : isRepresentative ? 'ADMIN' : role
				};
				await updateFamilyMember( memberId, memberData );
			} else {
				const memberData: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family'> = {
					family_id         : params.id,
					full_name         : fullName.trim(),
					rut               : rut.trim(),
					email             : email ? email.trim() : null,
					phone             : phone ? phone.trim() : null,
					organization      : organization,
					is_representative : isRepresentative,
					role              : isRepresentative ? 'ADMIN' : role
				};
				await createFamilyMember( memberData );
			}

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	},

	delete: async ( { request } ) => {
		const formData = await request.formData();
		const id       = formData.get( 'id' ) as string;

		if ( !id ) {
			return fail( 400, { error: 'Falta el ID del miembro.' } );
		}

		try {
			await deleteFamilyMember( id );

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
