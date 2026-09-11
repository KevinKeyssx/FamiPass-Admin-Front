import { supabaseServer } from '../supabase.js';

import type { User, UserRole } from '$lib/types/index.js';

export async function getUserRole(
	email: string
): Promise<UserRole | null> {
	const { data } = await supabaseServer
		.from( 'users' )
		.select( 'role' )
		.eq( 'email', email )
		.single();

	return ( data?.role as UserRole ) ?? null;
}

export async function getUsers( params?: {
	search?		: string;
	role?		: 'ALL' | UserRole;
	page?		: number;
	pageSize?	: number;
} ): Promise<{ data: User[]; count: number }> {
	const search	= params?.search || '';
	const role		= params?.role || 'ALL';
	const page		= params?.page || 1;
	const pageSize	= params?.pageSize || 12;

	let query = supabaseServer
		.from( 'users' )
		.select( '*', { count: 'exact' } );

	if ( search ) {
		query = query.or( `user_name.ilike.%${ search }%,email.ilike.%${ search }%` );
	}

	if ( role && role !== 'ALL' ) {
		query = query.eq( 'role', role );
	}

	query = query.order( 'user_name', { ascending: true } );

	const from = ( page - 1 ) * pageSize;
	const to   = from + pageSize - 1;

	const { data, error, count } = await query.range( from, to );

	if ( error ) {
		throw new Error( error.message );
	}

	return {
		data	: data as User[],
		count	: count || 0
	};
}

export async function getUserById( id: string ): Promise<User> {
	const { data, error } = await supabaseServer
		.from( 'users' )
		.select( '*' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as User;
}

export async function createUser(
	user: Omit<User, 'id' | 'created_at' | 'updated_at'>
): Promise<User> {
	const { data, error } = await supabaseServer
		.from( 'users' )
		.insert( [ user ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as User;
}

export async function updateUser(
	id: string,
	user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User> {
	const { data, error } = await supabaseServer
		.from( 'users' )
		.update( user )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as User;
}

export async function deleteUser( id: string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'users' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}

export async function getUserByEmail(
	email: string
): Promise<User | null> {
	const cleanEmail = email.trim().toLowerCase();

	const { data, error } = await supabaseServer
		.from( 'users' )
		.select( '*' )
		.ilike( 'email', cleanEmail )
		.limit( 1 );

	if ( error ) {
		throw new Error( error.message );
	}

	return data && data.length > 0 ? ( data[ 0 ] as User ) : null;
}
