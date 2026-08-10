export type CommunityOrganization =
    | 'CUORUM'
    | 'SOC_SOC'
    | 'HOMBRES_JOVENES'
    | 'MUJERES_JOVENES'
    | 'PRIMARIA'
    | 'FRIENDS'
    | 'NINGUNA';

export type RelationshipType =
    | 'PADRE'
    | 'MADRE'
    | 'HIJO'
    | 'HERMANO'
    | 'ABUELO'
    | 'CONYUGE'
    | 'NIETO'
    | 'TIO'
    | 'INVITADO'
    | 'OTRO';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'MEMBER';

export interface User {
    id               : string;
    rut              : string;
    email?           : string | null;
    full_name        : string;
    organization     : CommunityOrganization;
    role             : UserRole;
    is_active        : boolean;
    family_id?       : string | null;
    relationship?    : RelationshipType | null;
    is_representative: boolean;
    contact_phone?   : string | null;
    created_at?      : string;
    updated_at?      : string;
}
