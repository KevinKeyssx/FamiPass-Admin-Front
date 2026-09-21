import { fail } from '@sveltejs/kit';

import {
	createFamily,
	updateFamily
}                                       from '$lib/server/supabase/services/families.service.js';
import { createFamilyMember }           from '$lib/server/supabase/services/familyMembers.service.js';
import type { Family, FamilyMember }    from '$lib/types/index.js';
import type { PageServerLoad, Actions } from './$types.js';


export const load : PageServerLoad = async ( { url } ) => {
	const id = url.searchParams.get( 'id' );

	if ( !id ) {
		return { family : null };
	}

	return { family : null };
};

export const actions : Actions = {
	save : async ( { request, url } ) => {
		const id         = url.searchParams.get( 'id' );
		const formData   = await request.formData();
		const familyName = formData.get( 'family_name' ) as string;
		const membersStr = formData.get( 'members' ) as string;

		if ( !familyName || !familyName.trim() ) {
			return fail( 400, { error : 'El nombre de la familia es requerido.' } );
		}

		try {
			if ( id ) {
				const familyData : Partial<Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>> = {
					family_name : familyName.trim()
				};
				await updateFamily( id, familyData );
			} else {
				const code = Math.floor( Math.random() * 99999 ) + 1;
				const familyData : Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'> = {
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
							rut               : member.rut || null,
							email             : member.email || null,
							phone             : member.phone || null,
							organization      : member.organization,
							is_representative : member.is_representative,
							role              : member.role || ( member.is_representative ? 'ADMIN' : 'VIEWER' )
						} );
					}
				}
			}

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	}
};
