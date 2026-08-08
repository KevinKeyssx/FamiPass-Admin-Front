export interface Product {
    id                         : string;
    name                       : string;
    description?               : string;
    default_quantity_per_person: number;
    is_active                  : boolean;
    created_at?                : string;
    updated_at?                : string;
}
