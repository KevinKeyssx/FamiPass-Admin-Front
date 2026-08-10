import { supabaseServer }   from '../supabase.js';
import type { Product }     from '$lib/types/index.js';


export async function getProducts( params?: {
	search?   : string;
	page?     : number;
	pageSize? : number;
	status?   : 'ALL' | 'ACTIVE' | 'INACTIVE';
}): Promise<{ data: Product[]; count: number }> {
	const search   = params?.search || '';
	const page     = params?.page || 1;
	const pageSize = params?.pageSize || 12;
	const status   = params?.status || 'ALL';

	let query = supabaseServer
		.from( 'products' )
		.select( '*', { count: 'exact' } );

	if ( search ) {
		query = query.ilike( 'name', `%${ search }%` );
	}

	if ( status === 'ACTIVE' ) {
		query = query.eq( 'is_active', true );
	} else if ( status === 'INACTIVE' ) {
		query = query.eq( 'is_active', false );
	}

	query = query.order( 'name', { ascending: true } );

	const from = ( page - 1 ) * pageSize;
	const to   = from + pageSize - 1;

	const { data, error, count } = await query.range( from, to );

	if ( error ) {
		throw new Error( error.message );
	}

	return {
		data  : data as Product[],
		count : count || 0
	};
}


export async function getProductById( id: string ): Promise<Product | null> {
	const { data, error } = await supabaseServer
		.from( 'products' )
		.select( '*' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		if ( error.code === 'PGRST116' ) {
			return null;
		}
		throw new Error( error.message );
	}

	return data as Product;
}


export async function createProduct(
	body: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
	const { data, error } = await supabaseServer
		.from( 'products' )
		.insert( {
			name                        : body.name,
			description                 : body.description ?? null,
			default_quantity_per_person : body.default_quantity_per_person,
			is_active                   : body.is_active ?? true
		} )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Product;
}


export async function updateProduct(
	id: string,
	body: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<Product> {
	const { data, error } = await supabaseServer
		.from( 'products' )
		.update( body )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as Product;
}


export async function deleteProduct( id: string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'products' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
