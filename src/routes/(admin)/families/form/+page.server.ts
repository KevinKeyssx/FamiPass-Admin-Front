import { fail } from '@sveltejs/kit';

import {
	getFamilyWithDetails,
	createFamily,
	updateFamily
}                                       from '$lib/server/supabase/services/families.service.js';
import { createFamilyMember }           from '$lib/server/supabase/services/familyMembers.service.js';
import {
	getEvents,
	addFamilyToEvent,
	removeFamilyFromEvent
}                                       from '$lib/server/supabase/services/events.service.js';
import type { Family, FamilyMember }    from '$lib/types/index.js';
import type { PageServerLoad, Actions } from './$types.js';


export const load : PageServerLoad = async ( { url, depends } ) => {
	depends( 'app:family' );

	const id = url.searchParams.get( 'id' );

	try {
		const { data: events } = await getEvents( {
			pageSize : 100
		} );

		if ( !id ) {
			return {
				family       : null,
				familyEvents : [],
				events
			};
		}

		const { family, familyEvents } = await getFamilyWithDetails( id );

		return {
			family,
			familyEvents,
			events
		};
	} catch ( err : any ) {
		return {
			family       : null,
			familyEvents : [],
			events       : [],
			error        : err.message
		};
	}
};

export const actions : Actions = {
	save : async ( { request, url } ) => {
		const id             = url.searchParams.get( 'id' );
		const formData       = await request.formData();
		const familyName     = formData.get( 'family_name' ) as string;
		const membersStr     = formData.get( 'members' ) as string;
		const initialEventId = formData.get( 'initial_event_id' ) as string;

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

				// Si se seleccionó un evento inicial, asignamos el ticket/QR inmediatamente
				if ( initialEventId && initialEventId.trim() ) {
					await addFamilyToEvent( initialEventId.trim(), newFamily.id );
				}
			}

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	addTicket : async ( { request, url } ) => {
		const familyId = url.searchParams.get( 'id' );
		const formData = await request.formData();
		const eventId  = formData.get( 'eventId' ) as string;

		if ( !familyId ) {
			return fail( 400, { error : 'Falta el ID de la familia.' } );
		}

		if ( !eventId || !eventId.trim() ) {
			return fail( 400, { error : 'Debes seleccionar un evento válido.' } );
		}

		try {
			await addFamilyToEvent( eventId.trim(), familyId );

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	removeTicket : async ( { request } ) => {
		const formData      = await request.formData();
		const familyEventId = formData.get( 'familyEventId' ) as string;

		if ( !familyEventId ) {
			return fail( 400, { error : 'Falta el ID de la asignación del ticket.' } );
		}

		try {
			await removeFamilyFromEvent( familyEventId );

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	}
};
