import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import { getUsers, deleteUser }         from '$lib/server/supabase/services/users.service.js';
import type { UserRole }                from '$lib/types/index.js';


export const load: PageServerLoad = async ( { url, depends } ) => {
	depends( 'app:users' );

	const search   = url.searchParams.get( 'search' ) || '';
	const role     = ( url.searchParams.get( 'role' ) || 'ALL' ) as 'ALL' | UserRole;
	const page     = Number( url.searchParams.get( 'page' ) || '1' );
	const pageSize = Number( url.searchParams.get( 'pageSize' ) || '12' );

	try {
		const { data: users, count } = await getUsers( {
			search,
			role,
			page,
			pageSize
		} );

		return {
			users,
			count
		};
	} catch ( err: any ) {
		return {
			users : [],
			count : 0,
			error : err.message
		};
	}
};

export const actions: Actions = {
	delete: async ( { request } ) => {
		const formData = await request.formData();
		const id       = formData.get( 'id' ) as string;

		if ( !id ) {
			return fail( 400, { error: 'Falta el ID del usuario' } );
		}

		try {
			await deleteUser( id );

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
