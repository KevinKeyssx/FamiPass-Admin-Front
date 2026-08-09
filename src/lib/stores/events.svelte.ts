import type { EventConfig } from '$lib/types/index.js';


function createEventsStore() {
	let events        = $state<EventConfig[]>( [] );
	let isInitialized = $state( false );


    function set( list: EventConfig[] ): void {
		events        = list;
		isInitialized = true;
	}


    function add( event: EventConfig ): void {
		events = [ ...events, event ];
	}


    function update( event: EventConfig ): void {
		events = events.map( ( e ) => e.id === event.id ? event : e );
	}


    function remove( id: string ): void {
		events = events.filter( ( e ) => e.id !== id );
	}


    return {
		get list()          { return events; },
		get isInitialized() { return isInitialized; },
		set,
		add,
		update,
		remove,
	};
}


export const eventsStore = createEventsStore();
