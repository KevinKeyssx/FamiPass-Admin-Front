import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import {
	getAllFamiliesLookup,
	importFamiliesAndMembers
}                               from '$lib/server/supabase/services/families.service.js';
import type { ImportPayload }   from '$lib/types/index.js';


export const load: PageServerLoad = async () => {
	try {
		const existingFamilies = await getAllFamiliesLookup();

		return {
			existingFamilies
		};
	} catch ( err: any ) {
		return {
			existingFamilies : [],
			error            : err.message
		};
	}
};

export const actions: Actions = {
	import: async ( { request } ) => {
		const formData   = await request.formData();
		const payloadStr = formData.get( 'payload' ) as string;

		if ( !payloadStr ) {
			return fail( 400, { error: 'No se recibieron datos para importar.' } );
		}

		try {
			const payload: ImportPayload = JSON.parse( payloadStr );

			if ( !payload.groups || payload.groups.length === 0 ) {
				return fail( 400, { error: 'No se encontraron grupos familiares para procesar.' } );
			}

			const result = await importFamiliesAndMembers( payload );

			return {
				success : true,
				result
			};
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
