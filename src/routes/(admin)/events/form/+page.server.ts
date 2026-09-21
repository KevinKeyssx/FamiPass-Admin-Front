import { fail, redirect } from '@sveltejs/kit';

import {
	getEventById,
	createEvent,
	updateEvent,
	deleteEvent,
	syncEventProducts
}                                          from '$lib/server/supabase/services/events.service.js';
import { getProducts }                     from '$lib/server/supabase/services/products.service.js';
import type { PageServerLoad, Actions }    from './$types.js';
import type { EventConfig }                from '$lib/types/index.js';
import { auth }                            from '$lib/auth/auth.js';
import { getUserRole }                     from '$lib/server/supabase/services/users.service.js';
import { isEventExpired, hasEventStarted } from '$lib/utils/date.js';


export const load: PageServerLoad = async ( { url, request } ) => {
	const session = await auth.api.getSession( { headers: request.headers } );

	if ( !session ) {
		throw redirect( 302, '/login' );
	}

	const role = await getUserRole( session.user.email ?? '' );
	const id   = url.searchParams.get( 'id' );

	const { data: availableProducts } = await getProducts( {
		status   : 'ACTIVE',
		pageSize : 100
	} );

	if ( !id ) {
		return {
			event             : null,
			availableProducts,
			isSuperAdmin      : role === 'SUPER_ADMIN'
		};
	}

	const event = await getEventById( id );

	return {
		event,
		availableProducts,
		isSuperAdmin : role === 'SUPER_ADMIN'
	};
};


export const actions: Actions = {
	save: async ( { request, url } ) => {
		const session = await auth.api.getSession( { headers: request.headers } );

		if ( !session ) {
			return fail( 401, { error: 'No autorizado' } );
		}

		const role     = await getUserRole( session.user.email ?? '' );
		const formData = await request.formData();
		const id       = url.searchParams.get( 'id' );

		const event_name                 = formData.get( 'event_name' )                 as string | null;
		const event_date                 = formData.get( 'event_date' )                 as string | null;
		const registration_deadline      = formData.get( 'registration_deadline' )      as string | null;
		const expires_at                 = formData.get( 'expires_at' )                 as string | null;
		const status                     = formData.get( 'status' )                     as EventConfig['status'] | null;
		const max_family_members_raw     = formData.get( 'max_family_members' )         as string | null;
		const max_guests_per_family_raw  = formData.get( 'max_guests_per_family' )      as string | null;
		const detect_by_minors           = formData.get( 'detect_by_minors' )           === 'true';
		const require_guest_verification = formData.get( 'require_guest_verification' ) === 'true';
		const productsJson               = formData.get( 'products' )                   as string | null;

		if ( id ) {
			const existingEvent = await getEventById( id );
			if ( existingEvent ) {
				const hasStarted = hasEventStarted( existingEvent.event_date );

                if ( hasStarted && role !== 'SUPER_ADMIN' ) {
					return fail( 403, { error: 'El evento ya comenzó o finalizó. Solo un Super Administrador puede modificarlo.' } );
				}

				const isExpired = existingEvent.expires_at ? isEventExpired( existingEvent.expires_at ) : false;

                if ( isExpired ) {
					if ( role !== 'SUPER_ADMIN' ) {
						return fail( 403, { error: 'El evento ha expirado. Solo el SUPER_ADMIN puede modificar la fecha de expiración.' } );
					}

                    try {
						const updated = await updateEvent( id, { expires_at: expires_at || null } );

                        return { success: true, event: updated };
					} catch ( err: unknown ) {
						return fail( 500, { error: ( err as Error ).message } );
					}
				}
			}
		}

		if ( !event_name?.trim() ) {
			return fail( 400, { error: 'El nombre del evento es requerido.' } );
		}

		if ( !event_date ) {
			return fail( 400, { error: 'La fecha del evento es requerida.' } );
		}

		if ( !registration_deadline ) {
			return fail( 400, { error: 'La fecha límite de registro es requerida.' } );
		}

		let productItems: Array<{ product_id: string; quantity: number }> = [];

        if ( productsJson ) {
			try {
				productItems = JSON.parse( productsJson );
			} catch {
				return fail( 400, { error: 'Formato de productos inválido.' } );
			}
		}

		if ( !productItems || productItems.length === 0 ) {
			return fail( 400, { error: 'Debes asociar al menos un producto al evento.' } );
		}

		for ( const item of productItems ) {
			if ( !item.product_id || typeof item.quantity !== 'number' || item.quantity < 1 ) {
				return fail( 400, { error: 'Todos los productos asociados deben tener una cantidad válida mayor o igual a 1.' } );
			}
		}

		const max_family_members    = max_family_members_raw    ? Number( max_family_members_raw )    : null;
		const max_guests_per_family = max_guests_per_family_raw ? Number( max_guests_per_family_raw ) : null;

		const body: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'> = {
			event_name,
			event_date,
			registration_deadline,
			expires_at                 : expires_at || null,
			status                     : status ?? 'DRAFT',
			detect_by_minors,
			require_guest_verification,
			max_family_members,
			max_guests_per_family,
		};

		try {
			if ( id ) {
				const updated = await updateEvent( id, body );
				await syncEventProducts( id, productItems );
				return { success: true, event: updated };
			} else {
				const created = await createEvent( body );
				await syncEventProducts( created.id, productItems );
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
