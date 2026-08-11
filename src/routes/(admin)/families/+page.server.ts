import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import { getFamilies, deleteFamily }     from '$lib/server/supabase/services/families.service.js';


export const load: PageServerLoad = async ( { url, depends } ) => {
	depends( 'app:families' );

	const search   = url.searchParams.get( 'search' ) || '';
	const page     = Number( url.searchParams.get( 'page' ) || '1' );
	const pageSize = Number( url.searchParams.get( 'pageSize' ) || '12' );

	try {
		const { data: families, count } = await getFamilies( {
			search,
			page,
			pageSize
		} );

		return {
			families,
			count
		};
	} catch ( err: any ) {
		return {
			families : [],
			count    : 0,
			error    : err.message
		};
	}
};

export const actions: Actions = {
	delete: async ( { request } ) => {
		const formData = await request.formData();
		const id       = formData.get( 'id' ) as string;

		if ( !id ) {
			return fail( 400, { error: 'Falta el ID de la familia' } );
		}

		try {
			await deleteFamily( id );

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
