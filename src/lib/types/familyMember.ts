import type { Family } from "./family";

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


export interface FamilyMember {
    id                  : string;
    family_id           : string;
    full_name           : string;
    rut                 : string;
    phone?              : string | null;
    organization        : CommunityOrganization;
    relationship        : RelationshipType;
    is_representative   : boolean;
    created_at?         : string;
    updated_at?         : string;
    family?             : Family;
}
