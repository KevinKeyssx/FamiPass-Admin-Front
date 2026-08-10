<script lang="ts">
	import {
        CalendarDate,
        parseDate,
        today,
        getLocalTimeZone
    }                       from '@internationalized/date';
	import {
        CalendarDays,
        ChevronLeft,
        ChevronRight,
        CircleAlert
    }                       from '@lucide/svelte';
	import { DatePicker }   from 'bits-ui';

	import Select from '$lib/components/ui/Select.svelte';


	interface Props {
		label?          : string;
		value           : string;
		error?          : string | null;
		required?       : boolean;
		id?             : string;
		disabled?       : boolean;
		isDateDisabled? : ( date: CalendarDate ) => boolean;
	}


	let {
		label          = '',
		value          = $bindable( '' ),
		error          = null,
		required       = false,
		id             = '',
		disabled       = false,
		isDateDisabled = undefined
	} : Props = $props();

	let internalDate = $state<CalendarDate | undefined>( undefined );
	let isOpen       = $state( false );

	let calendarPlaceholder = $state<CalendarDate>(
		value ? parseDate( value.slice( 0, 10 ) ) : today( getLocalTimeZone() )
	);

	const monthsOptions = [
		{ value: '1',  label: 'Enero' },
		{ value: '2',  label: 'Febrero' },
		{ value: '3',  label: 'Marzo' },
		{ value: '4',  label: 'Abril' },
		{ value: '5',  label: 'Mayo' },
		{ value: '6',  label: 'Junio' },
		{ value: '7',  label: 'Julio' },
		{ value: '8',  label: 'Agosto' },
		{ value: '9',  label: 'Septiembre' },
		{ value: '10', label: 'Octubre' },
		{ value: '11', label: 'Noviembre' },
		{ value: '12', label: 'Diciembre' }
	];


	const yearsOptions: Array<{ value: string; label: string }> = [];


	for ( let y = 2100; y >= 2000; y-- ) {
		yearsOptions.push( { value: String( y ), label: String( y ) } );
	}

	// svelte-ignore state_referenced_locally
	let selectedMonth = $state( String( calendarPlaceholder.month ) );
	// svelte-ignore state_referenced_locally
	let selectedYear  = $state( String( calendarPlaceholder.year ) );


	$effect( () => {
		if ( value ) {
			try {
				const parsed = parseDate( value.slice( 0, 10 ) );
				if ( !internalDate || internalDate.compare( parsed ) !== 0 ) {
					internalDate = parsed;
					calendarPlaceholder = parsed;
				}
			} catch {
				internalDate = undefined;
			}
		} else {
			internalDate = undefined;
		}
	});


	$effect( () => {
		selectedMonth = String( calendarPlaceholder.month );
		selectedYear  = String( calendarPlaceholder.year );
	});


	$effect( () => {
		const monthNum = Number( selectedMonth );
		const yearNum  = Number( selectedYear );
		if ( monthNum !== calendarPlaceholder.month || yearNum !== calendarPlaceholder.year ) {
			calendarPlaceholder = new CalendarDate( yearNum, monthNum, 1 );
		}
	});


	function handleWheel( e: WheelEvent ): void {
		e.preventDefault();

		if ( e.deltaY < 0 ) {
			calendarPlaceholder = calendarPlaceholder.add( { months: 1 } );
		} else if ( e.deltaY > 0 ) {
			calendarPlaceholder = calendarPlaceholder.subtract( { months: 1 } );
		}
	}
</script>

<DatePicker.Root
	value={ internalDate }
	onValueChange={ ( v ) => {
		internalDate = v as CalendarDate | undefined;
		value = v ? v.toString() : '';
	} }
	isDateDisabled={ ( d ) => isDateDisabled ? isDateDisabled( d as CalendarDate ) : false }
	bind:placeholder={ calendarPlaceholder }
	bind:open={ isOpen }
	locale="es"
	weekStartsOn={ 1 }
	{ disabled }
	{ required }
>
	<div class="flex flex-col gap-1.5 w-full">
		{#if label}
			<span class="text-sm font-medium text-text-primary select-none">
				{ label }
				{#if required}
					<span class="text-accent">*</span>
				{/if}
			</span>
		{/if}

		<div class="relative w-full group">
			<DatePicker.Input
				onclick={ () => { isOpen = true; } }
				class="w-full px-4 py-2.5 pl-10 rounded-xl border transition-all duration-300 flex items-center gap-1
					bg-bg-surface-2 text-text-primary placeholder:text-text-muted text-sm
					focus-within:outline-none focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10
					{ error
						? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
						: 'border-border hover:border-accent/40'
					} disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{#snippet children( { segments } )}
					{#each segments as { part, value }}
						<DatePicker.Segment
							{part}
							class="rounded-sm px-0.5 focus:bg-accent/20 focus:text-accent focus:outline-none select-none uppercase text-sm"
						>
							{ value }
						</DatePicker.Segment>
					{/each}
				{/snippet}
			</DatePicker.Input>

			<DatePicker.Trigger
				class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent hover:text-accent transition-colors cursor-pointer"
			>
				<CalendarDays size={ 16 } />
			</DatePicker.Trigger>

			<DatePicker.Content
				class="z-50 rounded-2xl border border-border bg-bg-surface p-4 shadow-lg animate-in fade-in duration-200"
				sideOffset={ 12 }
			>
				<DatePicker.Calendar class="w-full" onwheel={ handleWheel }>
					{#snippet children( { months, weekdays } )}
						<!-- Calendar Header -->
						<div class="flex items-center justify-between gap-4 mb-4">
							<DatePicker.PrevButton
								class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-muted transition-colors shrink-0"
							>
								<ChevronLeft size={ 18 } />
							</DatePicker.PrevButton>

							<div class="flex items-center gap-1.5 max-w-55">
								<Select
									options={ monthsOptions }
									bind:value={ selectedMonth }
									size="small"
								/>

								<Select
									options={ yearsOptions }
									bind:value={ selectedYear }
									size="small"
								/>
							</div>

							<DatePicker.NextButton
								class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-muted transition-colors shrink-0"
							>
								<ChevronRight size={ 18 } />
							</DatePicker.NextButton>
						</div>

						<!-- Calendar Body -->
						<div class="space-y-2">
							{#each months as month}
								<table class="w-full border-collapse">
									<thead>
										<tr class="flex justify-between">
											{#each weekdays as day}
												<th class="w-8 text-center text-xs font-medium text-text-muted py-1 select-none">
													{ day.slice( 0, 2 ) }
												</th>
											{/each}
										</tr>
									</thead>

									<tbody>
										{#each month.weeks as week}
											<tr class="flex justify-between mt-1">
												{#each week as date}
													<DatePicker.Cell {date} month={month.value} class="w-8 h-8 flex items-center justify-center p-0">
														<DatePicker.Day
															class="w-full h-full rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center cursor-pointer
																text-text-primary hover:bg-bg-surface-2
																data-selected:bg-accent data-selected:text-accent-text data-selected:shadow-sm
																data-disabled:opacity-30 data-disabled:cursor-not-allowed
																data-unavailable:opacity-30 data-unavailable:cursor-not-allowed"
														/>
													</DatePicker.Cell>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							{/each}
						</div>
					{/snippet}
				</DatePicker.Calendar>
			</DatePicker.Content>
		</div>

		{#if error}
			<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
				<CircleAlert size={ 14 } class="shrink-0 text-red-500" />
				<span>{ error }</span>
			</div>
		{/if}
	</div>
</DatePicker.Root>
