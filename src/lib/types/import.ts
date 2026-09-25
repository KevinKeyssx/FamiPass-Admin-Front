import type { CommunityOrganization, FamilyMemberRole } from './familyMember.js';

export type FamilyImportAction = 'create' | 'link';

export interface ParsedMemberRow {
	temp_id           : string;
	full_name         : string;
	family_name       : string;
	rut               : string;
	phone             : string;
	email             : string;
	organization      : CommunityOrganization;
	is_representative : boolean;
	role              : FamilyMemberRole;
}

export interface ImportMemberItem {
	full_name         : string;
	rut               : string | null;
	phone             : string | null;
	email             : string | null;
	organization      : CommunityOrganization;
	is_representative : boolean;
	role              : FamilyMemberRole;
}

export interface FamilyGroupItem {
	family_name        : string;
	action             : FamilyImportAction;
	existing_family_id : string | null;
	members            : ImportMemberItem[];
}

export interface ExistingFamilyLookup {
	id          : string;
	family_name : string;
	code        : number;
}

export interface ImportPayload {
	groups : FamilyGroupItem[];
}

export interface ImportResult {
	success          : boolean;
	families_created : number;
	families_linked  : number;
	members_created  : number;
	error?           : string;
}
