import { supabaseServer } from '../supabase.js';

import type { Family } from '$lib/types/index.js';


export async function getFamilies(): Promise<Family[]> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( 'id, family_name, code' )
		.order( 'family_name', { ascending: true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Family[];
}
