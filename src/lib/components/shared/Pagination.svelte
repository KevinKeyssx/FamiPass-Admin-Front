<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

    import { Pagination }                   from 'bits-ui';
    import { ChevronLeft, ChevronRight }    from '@lucide/svelte';

    import Select from '$lib/components/ui/Select.svelte';


    interface Props {
		count : number;
	}


    let { count }: Props = $props();


    const currentPage = $derived( Number( page.url.searchParams.get( 'page' ) || '1' ) );
	const pageSize    = $derived( page.url.searchParams.get( 'pageSize' ) || '12' );


    const pageSizeOptions = [
		{ value: '12', label: '12 por pág.' },
		{ value: '24', label: '24 por pág.' },
		{ value: '48', label: '48 por pág.' },
		{ value: '96', label: '96 por pág.' }
	];

	// svelte-ignore state_referenced_locally
	let selectedPageSize = $state( pageSize );


    $effect( () => {
		selectedPageSize = pageSize;
	});


    $effect( () => {
		if ( selectedPageSize !== pageSize ) {
			handlePageSizeChange( selectedPageSize );
		}
	});


    function handlePageChange( newPage: number ): void {
		const url = new URL( page.url );

        url.searchParams.set( 'page', String( newPage ) );

        goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}


    function handlePageSizeChange( newSize: string ): void {
		const url = new URL( page.url );

        url.searchParams.set( 'pageSize', newSize );
		url.searchParams.set( 'page', '1' );

        goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}
</script>

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-(--border)/40 bg-(--bg-surface-2)/40 rounded-b-2xl mt-4">
	<!-- Page Size Selector -->
	<div class="flex items-center gap-2">
		<span class="text-xs text-(--text-secondary) font-medium">Mostrar:</span>

        <div class="w-36">
			<Select
				bind:value={ selectedPageSize }
				options={ pageSizeOptions }
				placeholder="Por página"
                size={'small'}
			/>
		</div>
	</div>

	<!-- Bits UI Pagination -->
	{#if count > 0 }
		<Pagination.Root
			count={ count }
			perPage={ Number( pageSize ) }
			page={ currentPage }
			onPageChange={ handlePageChange }
		>
			{#snippet children( { pages } )}
				<div class="flex items-center gap-1">
					<Pagination.PrevButton
						class="p-2 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) disabled:opacity-30 disabled:hover:text-(--text-secondary) disabled:hover:bg-transparent transition-all cursor-pointer"
						aria-label="Página anterior"
					>
						<ChevronLeft size={ 16 } />
					</Pagination.PrevButton>

					{#each pages as pageItem ( pageItem.key )}
						{#if pageItem.type === 'page' }
							<Pagination.Page
								page={ pageItem }
								class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer
									data-selected:bg-(--accent) data-selected:text-(--accent-text) data-selected:shadow-sm
									hover:bg-(--accent-muted) hover:text-(--accent) text-(--text-secondary)"
							>
								{ pageItem.value }
							</Pagination.Page>
						{:else}
							<span class="w-9 h-9 flex items-center justify-center text-xs text-(--text-muted)">
								...
							</span>
						{/if}
					{/each}

					<Pagination.NextButton
						class="p-2 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) disabled:opacity-30 disabled:hover:text-(--text-secondary) disabled:hover:bg-transparent transition-all cursor-pointer"
						aria-label="Página siguiente"
					>
						<ChevronRight size={ 16 } />
					</Pagination.NextButton>
				</div>
			{/snippet}
		</Pagination.Root>
	{/if}
</div>
