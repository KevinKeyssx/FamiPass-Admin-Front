import { supabaseServer } from '../supabase.js';

import type { FamilyMember } from '$lib/types/index.js';


export async function getFamilyMembers( familyId: string ): Promise<FamilyMember[]> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.select( '*' )
		.eq( 'family_id', familyId )
		.order( 'full_name', { ascending: true } );

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember[];
}

export async function getFamilyMemberById( id: string ): Promise<FamilyMember> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.select( '*' )
		.eq( 'id', id )
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function createFamilyMember(
	member: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family'>
): Promise<FamilyMember> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.insert( [ member ] )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function updateFamilyMember(
	id: string,
	member: Partial<Omit<FamilyMember, 'id' | 'created_at' | 'updated_at' | 'family'>>
): Promise<FamilyMember> {
	const { data, error } = await supabaseServer
		.from( 'family_members' )
		.update( member )
		.eq( 'id', id )
		.select()
		.single();

	if ( error ) {
		throw new Error( error.message );
	}

	return data as FamilyMember;
}

export async function deleteFamilyMember( id: string ): Promise<void> {
	const { error } = await supabaseServer
		.from( 'family_members' )
		.delete()
		.eq( 'id', id );

	if ( error ) {
		throw new Error( error.message );
	}
}
