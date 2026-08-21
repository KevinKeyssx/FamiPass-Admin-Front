import type { PageServerLoad } from './$types.js';

import { supabaseServer } from '$lib/server/supabase/supabase.js';
import type { Order }     from '$lib/types/index.js';


export const load: PageServerLoad = async () => {
	const [
		eventsRes,
		familiesCount,
		membersCount,
		ordersCount,
		deliveredCount,
		recentOrdersRes
	] = await Promise.all([
		supabaseServer.from( 'events' ).select( '*' ),
		supabaseServer.from( 'families' ).select( '*', { count : 'exact', head : true } ),
		supabaseServer.from( 'family_members' ).select( '*', { count : 'exact', head : true } ),
		supabaseServer.from( 'orders' ).select( '*', { count : 'exact', head : true } ),
		supabaseServer.from( 'orders' ).select( '*', { count : 'exact', head : true } ).eq( 'status', 'DELIVERED' ),
		supabaseServer.from( 'orders' )
			.select( `
				*,
				family_event:family_events (
					family:families ( family_name ),
					event:events ( event_name )
				)
			` )
			.order( 'created_at', { ascending : false } )
			.limit( 5 )
	]);

	return {
		events          : eventsRes.data || [],
		totalFamilies   : familiesCount.count || 0,
		totalMembers    : membersCount.count || 0,
		totalOrders     : ordersCount.count || 0,
		deliveredOrders : deliveredCount.count || 0,
		recentOrders    : ( recentOrdersRes.data || [] ) as unknown as Order[]
	};
};
