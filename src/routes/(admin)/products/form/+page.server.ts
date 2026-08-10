import { fail } from '@sveltejs/kit';

import {
    getProductById,
    createProduct,
    updateProduct
}                                       from '$lib/server/supabase/services/products.service.js';
import type { PageServerLoad, Actions } from './$types.js';
import type { Product }                 from '$lib/types/index.js';


export const load: PageServerLoad = async ( { url } ) => {
	const id = url.searchParams.get( 'id' );

	if ( !id ) {
		return { product: null };
	}

	const product = await getProductById( id );

	return { product };
};


export const actions: Actions = {
	save: async ( { request, url } ) => {
		const formData = await request.formData();
		const id       = url.searchParams.get( 'id' );

		const name                        = formData.get( 'name' ) as string | null;
		const description                 = formData.get( 'description' ) as string | null;
		const default_quantity_per_person = formData.get( 'default_quantity_per_person' ) as string | null;
		const is_active                   = formData.get( 'is_active' ) === 'true';

		if ( !name?.trim() ) {
			return fail( 400, { error: 'El nombre del producto es requerido.' } );
		}

		if ( !default_quantity_per_person || isNaN( Number( default_quantity_per_person ) ) ) {
			return fail( 400, { error: 'La cantidad por persona es requerida y debe ser numérica.' } );
		}

		const qty = Number( default_quantity_per_person );

        if ( qty < 0 ) {
			return fail( 400, { error: 'La cantidad por persona no puede ser negativa.' } );
		}

		const body: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
			name                        : name.trim(),
			description                 : description?.trim() || undefined,
			default_quantity_per_person : qty,
			is_active                   : is_active
		};

		try {
			if ( id ) {
				const updated = await updateProduct( id, body );
				return { success: true, product: updated };
			} else {
				const created = await createProduct( body );
				return { success: true, product: created };
			}
		} catch ( err: any ) {
			return fail( 500, { error: err.message } );
		}
	}
};
