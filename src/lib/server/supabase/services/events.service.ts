import { supabaseServer } from '../supabase.js';
import type { EventConfig } from '$lib/types/index.js';

export async function getEvents(): Promise<EventConfig[]> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( '*' )
		.order( 'event_date', { ascending: true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as EventConfig[];
}

export async function getEventById( id: string ): Promise<any | null> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.select( `
			*,
			family_events (
				*,
				family:families ( *, members:users ( * ) ),
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

	return data;
}

export async function createEvent(
	body: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<EventConfig> {
	const { data, error } = await supabaseServer
		.from( 'events' )
		.insert( {
			event_name					: body.event_name,
			event_date					: body.event_date,
			registration_deadline		: body.registration_deadline,
			detect_by_minors			: body.detect_by_minors ?? false,
			status						: body.status ?? 'DRAFT',
			max_family_members			: body.max_family_members ?? null,
			max_guests_per_family		: body.max_guests_per_family ?? null,
			require_guest_verification	: body.require_guest_verification ?? false,
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

	const { error } = await supabaseServer
		.from( 'events' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
