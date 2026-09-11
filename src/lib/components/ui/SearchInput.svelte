<script lang="ts">
	import { Search } from '@lucide/svelte';

	interface Props {
		value?       : string;
		placeholder? : string;
		debounceMs?  : number;
		id?          : string;
		disabled?    : boolean;
		size?        : 'small' | 'normal';
		class?       : string;
		onSearch?    : ( query: string ) => void;
		onClear?     : () => void;
	}

	let {
		value       = $bindable( '' ),
		placeholder = 'Buscar...',
		debounceMs  = 500,
		id          = '',
		disabled    = false,
		size        = 'normal',
		class       : className = '',
		onSearch,
		onClear
	} : Props = $props();

	let debounceTimer : ReturnType<typeof setTimeout> | null = null;

	$effect( () => {
		return () => {
			if ( debounceTimer ) {
				clearTimeout( debounceTimer );
			}
		};
	} );

	function handleInput( e: Event ) : void {
		const target = e.target as HTMLInputElement;
		value        = target.value;

		if ( debounceTimer ) {
			clearTimeout( debounceTimer );
		}

		debounceTimer = setTimeout( () => {
			triggerSearch();
		}, debounceMs );
	}

	function handleKeyDown( e: KeyboardEvent ) : void {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			triggerSearch();
		}
	}

	function triggerSearch() : void {
		if ( debounceTimer ) {
			clearTimeout( debounceTimer );
			debounceTimer = null;
		}

		onSearch?.( value );

		if ( !value.trim() ) {
			onClear?.();
		}
	}
</script>

<div class="relative w-full { className }">
	<input
		type="search"
		{ id }
		{ placeholder }
		{ disabled }
		value={ value }
		oninput={ handleInput }
		onkeydown={ handleKeyDown }
		class="w-full pl-4 pr-11 border transition-all duration-300
			bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted)
			border-(--border)/60 hover:border-(--accent)/40
			focus:outline-none focus:border-(--accent) focus:ring-4 focus:ring-(--accent)/10
			disabled:opacity-60 disabled:cursor-not-allowed
			{ size === 'small' ? 'py-1.5 rounded-lg text-xs' : 'py-2.5 rounded-xl text-sm' }"
	/>

	<button
		type="button"
		onclick={ triggerSearch }
		{ disabled }
		aria-label="Buscar"
		class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center
			rounded-lg bg-(--accent) text-(--accent-text) hover:bg-(--accent-hover)
			transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
			{ size === 'small' ? 'p-1.5' : 'p-2' }"
	>
		<Search size={ size === 'small' ? 13 : 15 } />
	</button>
</div>
