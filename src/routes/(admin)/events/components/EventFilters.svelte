<script lang="ts">
	import { X } from '@lucide/svelte';

    import DatePicker          from '$lib/components/ui/DatePicker.svelte';
	import Select              from '$lib/components/ui/Select.svelte';
	import FilterButtonGroup   from '$lib/components/ui/FilterButtonGroup.svelte';
	import SearchInput         from '$lib/components/ui/SearchInput.svelte';


    interface Props {
		searchQuery          : string;
		searchDate           : string;
		selectedStatus       : string;
		selectedVerification : string;
		selectedMinors       : string;
		onSearch             : () => void;
		onClearAll           : () => void;
	}


    let {
		searchQuery          = $bindable(),
		searchDate           = $bindable(),
		selectedStatus       = $bindable(),
		selectedVerification = $bindable(),
		selectedMinors       = $bindable(),
		onSearch,
		onClearAll
	} : Props = $props();


    const statusOptions = [
		{ value : 'ALL',         label : 'Todos los estados' },
		{ value : 'DRAFT',       label : 'Borrador' },
		{ value : 'IN_PROGRESS', label : 'En Curso' },
		{ value : 'FINISHED',    label : 'Finalizado' },
		{ value : 'CANCELLED',   label : 'Cancelado' }
	];


    const hasActiveFilters = $derived(
		searchQuery.trim()      !== ''
        || searchDate           !== ''
        || selectedStatus       !== 'ALL'
        || selectedVerification !== 'ALL'
        || selectedMinors       !== 'ALL'
	);
</script>

<div class="form-card p-3.5! sm:p-4! space-y-3!">
	<!-- Top Controls: Search, Date, Status -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
		<!-- 1. Search text -->
		<div class="sm:col-span-2 lg:col-span-5 min-w-0">
			<SearchInput
				bind:value={ searchQuery }
				onSearch={ onSearch }
				placeholder="Buscar eventos..."
			/>
		</div>

		<!-- 2. Date Picker -->
		<div class="lg:col-span-4 min-w-0">
			<div class="flex items-center gap-2 w-full">
				<span class="text-xs text-text-secondary font-medium whitespace-nowrap">Fecha:</span>

                <div class="flex-1 min-w-0">
					<DatePicker bind:value={ searchDate } />
				</div>
			</div>
		</div>

		<!-- 3. Status Selector -->
		<div class="lg:col-span-3 min-w-0">
			<Select
				bind:value={ selectedStatus }
				options={ statusOptions }
				placeholder="Estado"
			/>
		</div>
	</div>

	<!-- Bottom Controls: Grouped Boolean Toggles & Clear Filters Button -->
	<div class="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/30">
		<div class="flex flex-wrap items-center gap-3 sm:gap-6">
			<FilterButtonGroup
				label="Verificación"
				bind:value={ selectedVerification }
				options={ [
					{ value : 'TRUE',  label : 'Sí' },
					{ value : 'FALSE', label : 'No' }
				] }
			/>

			<FilterButtonGroup
				label="Menores"
				bind:value={ selectedMinors }
				options={ [
					{ value : 'TRUE',  label : 'Sí' },
					{ value : 'FALSE', label : 'No' }
				] }
			/>
		</div>

		{#if hasActiveFilters}
			<button
				onclick={ onClearAll }
				class="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer py-1 px-2.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-1.5 transition-all duration-200 ml-auto"
			>
				<X size={ 14 } />
				Limpiar filtros
			</button>
		{/if}
	</div>
</div>
