import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions }                 from './$types.js';
import { getFamilyById, createFamily, updateFamily }    from '$lib/server/supabase/services/families.service.js';
import { createFamilyMember }                           from '$lib/server/supabase/services/familyMembers.service.js';
import type { Family, FamilyMember }                    from '$lib/types/index.js';

export const load: PageServerLoad = async ( event ) => {
	const id = event.url.searchParams.get( 'id' );

	let family: Family | null = null;

	if ( id ) {
		try {
			family = await getFamilyById( id );
		} catch ( err: any ) {
			family = null;
		}
	}

	return {
		family
	};
};

export const actions: Actions = {
	save: async ( event ) => {
		const id       = event.url.searchParams.get( 'id' );
		const formData = await event.request.formData();

		const familyName = formData.get( 'family_name' ) as string;
		const membersStr = formData.get( 'members' ) as string;

		if ( !familyName || !familyName.trim() ) {
			return fail( 400, { error: 'El nombre de la familia es requerido.' } );
		}

		try {
			if ( id ) {
				const familyData: Partial<Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>> = {
					family_name : familyName.trim()
				};
				await updateFamily( id, familyData );
			} else {
				const code = Math.floor( Math.random() * 99999 ) + 1;
				const familyData: Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'> = {
					family_name : familyName.trim(),
					code        : code
				};
				const newFamily = await createFamily( familyData );

				// Si hay miembros en la lista local, los insertamos vinculando el nuevo family_id
				if ( membersStr ) {
					const membersList = JSON.parse( membersStr ) as Array<Omit<FamilyMember, 'id' | 'family_id' | 'created_at' | 'updated_at' | 'family'>>;
					for ( const member of membersList ) {
						await createFamilyMember( {
							family_id         : newFamily.id,
							full_name         : member.full_name,
							rut               : member.rut,
							email             : member.email || null,
							phone             : member.phone || null,
							organization      : member.organization,
							is_representative : member.is_representative,
							role              : member.role || ( member.is_representative ? 'ADMIN' : 'VIEWER' )
						} );
					}
				}
			}

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
