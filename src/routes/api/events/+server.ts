import { json }            from '@sveltejs/kit';
import { supabaseServer }  from '$lib/server/supabase/supabase.js';
import type { RequestHandler } from './$types.js';
import type { EventConfig }    from '$lib/types/index.js';

export const GET: RequestHandler = async () => {
    const { data, error } = await supabaseServer
        .from( 'events' )
        .select( '*' )
        .order( 'event_date', { ascending: true } );

    if ( error ) {
        return json( { error: error.message }, { status: 500 } );
    }

    return json( data as EventConfig[] );
};

export const POST: RequestHandler = async ( { request } ) => {
    let body: Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>;

    try {
        body = await request.json();
    } catch {
        return json( { error: 'Invalid JSON body' }, { status: 400 } );
    }

    if ( !body.event_name || !body.event_date || !body.registration_deadline ) {
        return json( { error: 'Missing required fields: event_name, event_date, registration_deadline' }, { status: 400 } );
    }

    const { data, error } = await supabaseServer
        .from( 'events' )
        .insert( {
            event_name                : body.event_name,
            event_date                : body.event_date,
            registration_deadline     : body.registration_deadline,
            detect_by_minors          : body.detect_by_minors          ?? false,
            status                    : body.status                    ?? 'DRAFT',
            max_family_members        : body.max_family_members        ?? null,
            max_guests_per_family     : body.max_guests_per_family     ?? null,
            require_guest_verification: body.require_guest_verification ?? false,
        } )
        .select()
        .single();

    if ( error ) {
        return json( { error: error.message }, { status: 500 } );
    }

    return json( data as EventConfig, { status: 201 } );
};
