import { redirect }        from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

import { getUserRole }      from '$lib/server/supabase/services/users.service.js';
import { auth }             from '$lib/auth/auth.js';
import type { UserRole }    from '$lib/types/user';


export const load: ServerLoad = async ( event ) => {
    const session = await auth.api.getSession({ headers: event.request.headers });

    if ( !session ) {
        throw redirect( 302, '/login' );
    }

    const role = await getUserRole( session.user.email ?? '' ) as UserRole;

    if ( ![ 'SUPER_ADMIN', 'ADMIN' ].includes( role )) {
        throw redirect( 302, '/login?error=unauthorized' );
    }

    return { user: session.user };
};
