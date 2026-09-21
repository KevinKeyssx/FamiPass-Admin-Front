import { supabaseServer } from '../supabase.js';

import type {
    EventConfig,
    EventStatus
}                           from '$lib/types/index.js';
import { isEventExpired }   from '$lib/utils/date.js';


export async function getEvents( params?: {
	search?       : string;
	date?         : string;
	status?       : 'ALL' | EventStatus;
	verification? : 'ALL' | 'TRUE' | 'FALSE';
	minors?       : 'ALL' | 'TRUE' | 'FALSE';
	page?         : number;
	pageSize?     : number;
}): Promise<{ data: EventConfig[]; count: number }> {
	const search       = params?.search || '';
	const date         = params?.date || '';
	const status       = params?.status || 'ALL';
	const verification = params?.verification || 'ALL';
	const minors       = params?.minors || 'ALL';
	const page         = params?.page || 1;
	const pageSize     = params?.pageSize || 12;

	let query = supabaseServer
		.from( 'events' )
		.select( '*', { count: 'exact' } );

	if ( search ) {
		query = query.ilike( 'event_name', `%${ search }%` );
	}

	if ( date ) {
		query = query.eq( 'event_date', date );
	}

	if ( status && status !== 'ALL' ) {
		query = query.eq( 'status', status );
	}

	if ( verification && verification !== 'ALL' ) {
		query = query.eq( 'require_guest_verification', verification === 'TRUE' );
	}

	if ( minors && minors !== 'ALL' ) {
		query = query.eq( 'detect_by_minors', minors === 'TRUE' );
	}

	query = query.order( 'event_date', { ascending: true } );

	const from = ( page - 1 ) * pageSize;
	const to   = from + pageSize - 1;

	const { data, error, count } = await query.range( from, to );

	if ( error ) {
		throw new Error( error.message );
	}

	return {
		data  : data as EventConfig[],
		count : count || 0
	};
}


export async function getEventById( id: string ): Promise<EventConfig | null> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( `
			*,
			event_products (
				*,
				product:products ( * )
			),
			family_events (
				*,
				family:families ( *, members:family_members ( * ) ),
				orders (
					*,
					items:order_items ( *, product:products ( * ) )
				)
			)
		` )
		.eq( 'id', id )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	return data as EventConfig;
}


export async function syncEventProducts(
	eventId : string,
	items   : Array<{ product_id: string; quantity: number }>
): Promise<void> {
	const { error: deleteError } = await supabaseServer
		.from( 'event_products' )
		.delete()
		.eq( 'event_id', eventId );

	if ( deleteError ) {
		throw new Error( deleteError.message );
	}

	if ( items.length === 0 ) {
		return;
	}

	const toInsert = items.map( ( item ) => ({
		event_id   : eventId,
		product_id : item.product_id,
		quantity   : item.quantity,
		status     : 'AVAILABLE'
	}) );

	const { error: insertError } = await supabaseServer
		.from( 'event_products' )
		.insert( toInsert );

	if ( insertError ) {
		throw new Error( insertError.message );
	}
}


export async function createEvent(
	body: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<EventConfig> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.insert( {
			event_name                 : body.event_name,
			event_date                 : body.event_date,
			registration_deadline      : body.registration_deadline,
			expires_at                 : body.expires_at ?? null,
			detect_by_minors           : body.detect_by_minors ?? false,
			status                     : body.status ?? 'DRAFT',
			max_family_members         : body.max_family_members ?? null,
			max_guests_per_family      : body.max_guests_per_family ?? null,
			require_guest_verification : body.require_guest_verification ?? false
		} )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventConfig;
}


export async function updateEvent(
	id: string,
	body: Partial<Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<EventConfig> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.update( body )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventConfig;
}


export async function deleteEvent( id: string ): Promise<void> {
	const { data: event, error: fetchError } = await supabaseServer
		.from( 'events' )
		.select( 'status' )
		.eq( 'id', id )
		.single();

	if ( fetchError ) {
		throw new Error( fetchError.message );
	}

	if ( event.status !== 'DRAFT' ) {
		throw new Error( `Cannot delete an event with status "${ event.status }". Only DRAFT events can be deleted.` );
	}

	await supabaseServer
		.from( 'event_products' )
		.delete()
		.eq( 'event_id', id );

	const { error } = await supabaseServer
		.from( 'events' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}


export async function addFamilyToEvent( eventId: string, familyId: string ): Promise<void> {
	const event = await getEventById( eventId );

	if ( !event ) {
		throw new Error( 'Evento no encontrado' );
	}

	if ( event.expires_at && isEventExpired( event.expires_at ) ) {
		throw new Error( 'El evento ha expirado y no se pueden asociar familias.' );
	}

	const { error } = await supabaseServer
		.from( 'family_events' )
		.insert({
			event_id    : eventId,
			family_id   : familyId,
		});

	if ( error ) {
		throw new Error( error.message );
	}
}


export async function removeFamilyFromEvent( id: string ): Promise<void> {
	const { data: familyEvent, error: fetchError } = await supabaseServer
		.from( 'family_events' )
		.select( 'event_id' )
		.eq( 'id', id )
		.single();

	if ( fetchError ) {
		throw new Error( fetchError.message );
	}

	const event = await getEventById( familyEvent.event_id );

	if ( !event ) {
		throw new Error( 'Evento no encontrado' );
	}

	if ( event.expires_at && isEventExpired( event.expires_at ) ) {
		throw new Error( 'El evento ha expirado y no se pueden desasociar familias.' );
	}

	const { error } = await supabaseServer
		.from( 'family_events' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
