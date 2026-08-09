import { fail } from '@sveltejs/kit';

import {
    getEventById,
	createEvent,
	updateEvent,
	deleteEvent,
}                                       from '$lib/server/supabase/services/events.service.js';
import type { PageServerLoad, Actions } from './$types.js';
import type { EventConfig }             from '$lib/types/index.js';


export const load: PageServerLoad = async ( { url } ) => {
	const id = url.searchParams.get( 'id' );

	if ( !id ) {
		return { event: null };
	}

	const event = await getEventById( id );

	return { event };
};


export const actions: Actions = {
	save: async ( { request, url } ) => {
		const formData = await request.formData();
		const id       = url.searchParams.get( 'id' );

		const event_name                    = formData.get( 'event_name' )                  as string | null;
		const event_date                    = formData.get( 'event_date' )                  as string | null;
		const registration_deadline         = formData.get( 'registration_deadline' )       as string | null;
		const status                        = formData.get( 'status' )                      as EventConfig['status'] | null;
		const max_family_members_raw        = formData.get( 'max_family_members' )          as string | null;
		const max_guests_per_family_raw     = formData.get( 'max_guests_per_family' )       as string | null;
		const detect_by_minors              = formData.get( 'detect_by_minors' )            === 'true';
		const require_guest_verification    = formData.get( 'require_guest_verification' )  === 'true';

		if ( !event_name?.trim() ) {
			return fail( 400, { error: 'El nombre del evento es requerido.' } );
		}

        if ( !event_date ) {
			return fail( 400, { error: 'La fecha del evento es requerida.' } );
		}

        if ( !registration_deadline ) {
			return fail( 400, { error: 'La fecha límite de registro es requerida.' } );
		}

		const max_family_members     = max_family_members_raw    ? Number( max_family_members_raw )    : null;
		const max_guests_per_family  = max_guests_per_family_raw ? Number( max_guests_per_family_raw ) : null;

		const body: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'> = {
			event_name                : event_name.trim(),
			event_date,
			registration_deadline,
			status                    : status ?? 'DRAFT',
			detect_by_minors,
			require_guest_verification,
			max_family_members,
			max_guests_per_family,
		};

		try {
			if ( id ) {
				const updated = await updateEvent( id, body );
				return { success: true, event: updated };
			} else {
				const created = await createEvent( body );
				return { success: true, event: created };
			}
		} catch ( err: unknown ) {
			return fail( 500, { error: ( err as Error ).message } );
		}
	},

	delete: async ( { url } ) => {
		const id = url.searchParams.get( 'id' );

		if ( !id ) {
			return fail( 400, { error: 'Falta el ID del evento.' } );
		}

		try {
			await deleteEvent( id );
			return { success: true };
		} catch ( err: unknown ) {
			return fail( 400, { error: ( err as Error ).message } );
		}
	},
};
