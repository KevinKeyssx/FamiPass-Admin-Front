import { supabaseServer } from '../supabase.js';

import type { Family } from '$lib/types/index.js';


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
