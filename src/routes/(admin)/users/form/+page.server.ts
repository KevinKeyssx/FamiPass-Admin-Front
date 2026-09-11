import { fail } from '@sveltejs/kit';

import {
	getUserById,
	createUser,
	updateUser,
	getUserRole
}                                       from '$lib/server/supabase/services/users.service.js';
import type { PageServerLoad, Actions } from './$types.js';
import { auth }                         from '$lib/auth/auth.js';
import type { User, UserRole }          from '$lib/types/index.js';

export const load: PageServerLoad = async ( event ) => {
	const userId = event.url.searchParams.get( 'id' );

	let user: User | null = null;
	if ( userId ) {
		try {
			user = await getUserById( userId );
		} catch ( err: any ) {
			user = null;
		}
	}

	const session = await auth.api.getSession( { headers: event.request.headers } );
	const currentUserRole = session ? await getUserRole( session.user.email ?? '' ) : null;

	return {
		user,
		currentUserRole
	};
};

export const actions: Actions = {
	save: async ( event ) => {
		const userId   = event.url.searchParams.get( 'id' );
		const formData = await event.request.formData();

		const userName		= formData.get( 'user_name' ) as string;
		const emailPrefix	= formData.get( 'email' ) as string;
		const email			= emailPrefix ? `${ emailPrefix.trim() }@gmail.com` : '';
		const role			= formData.get( 'role' ) as UserRole;
		const phone			= formData.get( 'phone' ) as string;
		const isActive		= formData.get( 'is_active' ) === 'true';

		// Validaciones Básicas
		if ( !userName || !userName.trim() ) {
			return fail( 400, { error: 'El nombre de usuario es requerido.' } );
		}

		if ( !email || !email.trim() ) {
			return fail( 400, { error: 'El correo electrónico es requerido.' } );
		}

		if ( !role ) {
			return fail( 400, { error: 'El rol es requerido.' } );
		}

		// Validaciones de Jerarquía de Roles
		const session = await auth.api.getSession( { headers: event.request.headers } );
		const currentUserRole = session ? await getUserRole( session.user.email ?? '' ) : null;

		if ( currentUserRole === 'ADMIN' && ( role === 'SUPER_ADMIN' || role === 'ADMIN' ) ) {
			return fail( 403, { error: 'No tienes permisos para crear o editar usuarios con rol de Administrador o Súper Administrador.' } );
		}

		const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
			email		: email.trim(),
			user_name	: userName.trim(),
			phone		: phone ? phone.trim() : null,
			role		: role,
			is_active	: isActive
		};

		try {
			if ( userId ) {
				await updateUser( userId, userData );
			} else {
				await createUser( userData );
			}

			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
