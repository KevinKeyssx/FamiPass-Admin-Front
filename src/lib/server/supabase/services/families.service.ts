import { supabaseServer } from '../supabase.js';

import type {
	Family,
	FamilyEvent,
	ExistingFamilyLookup,
	ImportPayload,
	ImportResult,
	FamilyMember
} from '$lib/types/index.js';


export async function getFamilies( params?: {
	search?   : string;
	page?     : number;
	pageSize? : number;
} ): Promise<{ data: Family[]; count: number }> {
	const search   = params?.search || '';
	const page     = params?.page || 1;
	const pageSize = params?.pageSize || 12;

	let query = supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(id)', { count: 'exact' } );

	if ( search ) {
		query = query.ilike( 'family_name', `%${ search }%` );
	}

	query = query.order( 'family_name', { ascending: true } );

	const from = ( page - 1 ) * pageSize;
	const to   = from + pageSize - 1;

	const { data, error, count } = await query.range( from, to );

	if ( error ) {
		throw new Error( error.message );
	}

	const dataWithCount = ( data || [] ).map( ( item: any ) => ( {
		...item,
		members_count : item.members ? item.members.length : 0
	} ) );

	return {
		data  : dataWithCount as Family[],
		count : count || 0
	};
}

export async function getFamilyById( id: string ): Promise<Family> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(id)' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	const family = data as any;
	family.members_count = family.members ? family.members.length : 0;

	return family as Family;
}

export async function getFamilyWithDetails( id: string ): Promise<{
	family       : Family;
	familyEvents : FamilyEvent[];
}> {
	const { data: familyData, error: famError } = await supabaseServer
		.from( 'families' )
		.select( '*, members:family_members(*)' )
		.eq( 'id', id )
		.single();

	if ( famError ) {
		throw new Error( famError.message );
	}

	const family = familyData as any;
	family.members_count = family.members ? family.members.length : 0;

	const { data: feData, error: feError } = await supabaseServer
		.from( 'family_events' )
		.select( `
			*,
			event:events(*),
			orders(
				*,
				items:order_items(
					*,
					product:products(*)
				)
			)
		` )
		.eq( 'family_id', id );

	if ( feError ) {
		throw new Error( feError.message );
	}

	const familyEvents = ( feData || [] ).map( ( fe: any ) => ({
		...fe,
		family
	}) );

	return {
		family       : family as Family,
		familyEvents : familyEvents as FamilyEvent[]
	};
}

export async function createFamily(
	family: Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>
): Promise<Family> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.insert( [ family ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Family;
}

export async function updateFamily(
	id: string,
	family: Partial<Omit<Family, 'id' | 'created_at' | 'updated_at' | 'members_count'>>
): Promise<Family> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.update( family )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Family;
}

export async function deleteFamily( id: string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'families' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}

export async function getAllFamiliesLookup(): Promise<ExistingFamilyLookup[]> {
	const { data, error } = await supabaseServer
		.from( 'families' )
		.select( 'id, family_name, code' )
		.order( 'family_name', { ascending: true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return ( data || [] ) as ExistingFamilyLookup[];
}

export async function importFamiliesAndMembers( payload: ImportPayload ): Promise<ImportResult> {
	let familiesCreated = 0;
	let familiesLinked  = 0;
	let membersCreated  = 0;

	const allMembersToInsert: Array<Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family' | 'user'>> = [];

	for ( const group of payload.groups ) {
		let familyId = group.existing_family_id;

		if ( group.action === 'create' || !familyId ) {
			const code = Math.floor( Math.random() * 99999 ) + 1;
			const { data: newFamily, error: familyError } = await supabaseServer
				.from( 'families' )
				.insert([ {
					family_name : group.family_name.trim(),
					code        : code
				} ])
				.select( 'id' )
				.single();

			if ( familyError ) {
				throw new Error( `Error al crear la familia "${ group.family_name }": ${ familyError.message }` );
			}

			familyId = newFamily.id;
			familiesCreated++;
		} else {
			familiesLinked++;
		}

		if ( !familyId ) {
			throw new Error( `No se pudo determinar el identificador para la familia "${ group.family_name }"` );
		}

		for ( const member of group.members ) {
			allMembersToInsert.push({
				family_id         : familyId,
				user_id           : null,
				full_name         : member.full_name.trim(),
				rut               : member.rut?.trim() || null,
				phone             : member.phone?.trim() || null,
				email             : member.email?.trim() || null,
				organization      : member.organization || 'NINGUNA',
				is_representative : member.is_representative ?? true,
				role              : member.role || 'ADMIN'
			});
		}
	}

	if ( allMembersToInsert.length > 0 ) {
		const chunkSize = 100;
		for ( let i = 0; i < allMembersToInsert.length; i += chunkSize ) {
			const chunk = allMembersToInsert.slice( i, i + chunkSize );
			const { error: membersError } = await supabaseServer
				.from( 'family_members' )
				.insert( chunk );

			if ( membersError ) {
				throw new Error( `Error al registrar miembros: ${ membersError.message }` );
			}

			membersCreated += chunk.length;
		}
	}

	return {
		success          : true,
		families_created : familiesCreated,
		families_linked  : familiesLinked,
		members_created  : membersCreated
	};
}
