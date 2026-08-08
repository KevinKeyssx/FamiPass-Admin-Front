import type { User }        from './user.js';
import type { EventConfig } from './event.js';

export interface Family {
    id          : string;
    family_name : string;
    created_at? : string;
    updated_at? : string;
    members?    : User[];
}

export interface FamilyEvent {
    id           : string;
    family_id    : string;
    event_id     : string;
    qr_code_hash : string;
    created_at?  : string;
    updated_at?  : string;
    family?      : Family;
    event?       : EventConfig;
}
