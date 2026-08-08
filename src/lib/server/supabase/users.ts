import { supabaseServer } from './supabase.js';

/**
 * Obtiene el rol de un usuario desde la base de datos de Supabase dado su correo electrónico.
 * 
 * @param email Correo electrónico del usuario.
 * @returns Promesa que se resuelve con el rol del usuario ('ADMIN' | 'STAFF' | 'MEMBER') o null si no se encuentra.
 */
export async function getUserRole( email: string ): Promise<string | null> {
	console.log('🚀 ~ getUserRole ~ email:', email)
	const { data } = await supabaseServer
		.from( 'users' )
		.select( 'role' )
		.eq( 'email', email )
		.single();
	console.log('🚀 ~ getUserRole ~ data:', data)

	return data?.role ?? null;
}
