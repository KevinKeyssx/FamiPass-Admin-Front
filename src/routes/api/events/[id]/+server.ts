import { json }            from '@sveltejs/kit';
import { supabaseServer }  from '$lib/server/supabase/supabase.js';
import type { RequestHandler } from './$types.js';
import type { EventConfig }    from '$lib/types/index.js';

export const GET: RequestHandler = async ( { params } ) => {
    const { id } = params;

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
            return json( { error: 'Event not found' }, { status: 404 } );
        }
        return json( { error: error.message }, { status: 500 } );
    }

    return json( data );
};

export const PATCH: RequestHandler = async ( { params, request } ) => {
    const { id } = params;

    let body: Partial<Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>>;

    try {
        body = await request.json();
    } catch {
        return json( { error: 'Invalid JSON body' }, { status: 400 } );
    }

    const { data, error } = await supabaseServer
        .from( 'events' )
        .update( body )
        .eq( 'id', id )
        .select()
        .single();

    if ( error ) {
        if ( error.code === 'PGRST116' ) {
            return json( { error: 'Event not found' }, { status: 404 } );
        }
        return json( { error: error.message }, { status: 500 } );
    }

    return json( data as EventConfig );
};

export const DELETE: RequestHandler = async ( { params } ) => {
    const { id } = params;

    const { data: event, error: fetchError } = await supabaseServer
        .from( 'events' )
        .select( 'status' )
        .eq( 'id', id )
        .single();

    if ( fetchError ) {
        if ( fetchError.code === 'PGRST116' ) {
            return json( { error: 'Event not found' }, { status: 404 } );
        }
        return json( { error: fetchError.message }, { status: 500 } );
    }

    if ( event.status !== 'DRAFT' ) {
        return json(
            { error: `Cannot delete an event with status "${ event.status }". Only DRAFT events can be deleted.` },
            { status: 409 }
        );
    }

    const { error } = await supabaseServer
        .from( 'events' )
        .delete()
        .eq( 'id', id );

    if ( error ) {
        return json( { error: error.message }, { status: 500 } );
    }

    return new Response( null, { status: 204 } );
};
