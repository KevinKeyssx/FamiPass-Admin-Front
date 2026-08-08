export const INTERNAL_ENDPOINT = {
    events: {
        list  : '/api/events',
        create: '/api/events',
        detail: ( id: string ): string => `/api/events/${ id }`,
        update: ( id: string ): string => `/api/events/${ id }`,
        delete: ( id: string ): string => `/api/events/${ id }`,
    },
};
