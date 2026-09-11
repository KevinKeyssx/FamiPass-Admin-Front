<script lang="ts">
	import { X }               from '@lucide/svelte';
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
		searchQuery.trim() !== '' ||
		searchDate !== '' ||
		selectedStatus !== 'ALL' ||
		selectedVerification !== 'ALL' ||
		selectedMinors !== 'ALL'
	);
</script>

<div class="form-card p-3!">
	<!-- Single line grid container with exactly 4 columns on desktop -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-center">
		<!-- 1. Search text -->
		<SearchInput
			bind:value={ searchQuery }
			onSearch={ onSearch }
			placeholder="Buscar eventos..."
		/>

		<!-- 2. Date Picker -->
		<div class="flex items-center gap-2 w-full">
			<span class="text-xs text-text-secondary font-medium whitespace-nowrap">Fecha:</span>
			<div class="flex-1">
				<DatePicker bind:value={ searchDate } />
			</div>
		</div>

		<!-- 3. Status Selector -->
		<div class="w-full">
			<Select
				bind:value={ selectedStatus }
				options={ statusOptions }
				placeholder="Estado"
			/>
		</div>

		<!-- 4. Grouped Boolean Toggles & Clear Filters Button -->
		<div class="flex items-center justify-between gap-4 w-full xl:justify-start">
			<div class="flex items-center gap-4">
				<FilterButtonGroup
					label="Verificación"
					bind:value={ selectedVerification }
					options={ [
						{ value: 'TRUE', label: 'Sí' },
						{ value: 'FALSE', label: 'No' }
					] }
				/>

				<FilterButtonGroup
					label="Menores"
					bind:value={ selectedMinors }
					options={ [
						{ value: 'TRUE', label: 'Sí' },
						{ value: 'FALSE', label: 'No' }
					] }
				/>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={ onClearAll }
					class="text-xs text-red-500 hover:text-red-600 hover:underline font-semibold cursor-pointer shrink-0 py-2 px-1 flex items-center gap-1 transition-all duration-200"
				>
					<X size={ 14 } />
					Limpiar
				</button>
			{/if}
		</div>
	</div>
</div>
