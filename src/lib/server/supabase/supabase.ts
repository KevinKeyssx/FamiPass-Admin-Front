import { createClient } from '@supabase/supabase-js';

import { ENV } from '$lib/server/env.server.js';


export const supabaseServer = createClient(
    ENV.SUPABASE.URL,
    ENV.SUPABASE.KEY,
    {
        auth: {
            autoRefreshToken : false,
            persistSession   : false,
        },
    }
);
