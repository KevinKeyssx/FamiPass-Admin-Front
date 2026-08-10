import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import { getProducts, deleteProduct }   from '$lib/server/supabase/services/products.service.js';


export const load: PageServerLoad = async ( { url, depends } ) => {
	depends( 'app:products' );

	const search   = url.searchParams.get( 'search' ) || '';
	const page     = Number( url.searchParams.get( 'page' ) || '1' );
	const pageSize = Number( url.searchParams.get( 'pageSize' ) || '12' );
	const status   = ( url.searchParams.get( 'status' ) || 'ALL' ) as 'ALL' | 'ACTIVE' | 'INACTIVE';

	try {
		const { data: products, count } = await getProducts( {
			search,
			page,
			pageSize,
			status
		});

		return {
			products,
			count
		};
	} catch ( err: any ) {
		return {
			products : [],
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
			return fail( 400, { error: 'Falta el ID del producto' } );
		}

		try {
			await deleteProduct( id );

            return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
