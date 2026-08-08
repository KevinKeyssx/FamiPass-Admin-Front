<script lang="ts">
	import { DatePicker } from 'bits-ui';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from '@lucide/svelte';

	interface Props {
		label?    : string;
		value     : string;
		error?    : string | null;
		required? : boolean;
		id?       : string;
		disabled? : boolean;
	}

	let {
		label    = '',
		value    = $bindable(''),
		error    = null,
		required = false,
		id       = '',
		disabled = false
	} : Props = $props();

	let internalDate = $state<CalendarDate | undefined>( undefined );

	// Sincronizar de afuera hacia adentro
	$effect( () => {
		if ( value ) {
			try {
				const parsed = parseDate( value );
				if ( !internalDate || internalDate.compare( parsed ) !== 0 ) {
					internalDate = parsed;
				}
			} catch {
				internalDate = undefined;
			}
		} else {
			internalDate = undefined;
		}
	} );

	// Sincronizar de adentro hacia afuera
	$effect( () => {
		const newStr = internalDate ? internalDate.toString() : '';
		if ( value !== newStr ) {
			value = newStr;
		}
	} );
</script>

<DatePicker.Root bind:value={ internalDate } { disabled } { required }>
	<div class="flex flex-col gap-1.5 w-full">
		{#if label}
			<span class="text-sm font-medium text-(--text-primary) select-none">
				{ label }
				{#if required}
					<span class="text-red-500">*</span>
				{/if}
			</span>
		{/if}

		<div class="relative w-full">
			<DatePicker.Input
				class="w-full px-4 py-2.5 pl-10 rounded-xl border transition-all duration-200 flex items-center gap-1
				       bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted)
				       focus-within:outline-none focus-within:ring-2 focus-within:ring-(--accent)/20
				       { error
				           ? 'border-red-500 focus-within:border-red-500'
				           : 'border-(--border) focus-within:border-(--border-focus)' }
				       disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{#snippet children({ segments })}
					{#each segments as { part, value }}
						<DatePicker.Segment
							{part}
							class="rounded-sm px-0.5 focus:bg-(--accent)/20 focus:text-(--accent) focus:outline-none select-none uppercase text-sm"
						>
							{ value }
						</DatePicker.Segment>
					{/each}
				{/snippet}
			</DatePicker.Input>

			<DatePicker.Trigger
				class="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors"
			>
				<CalendarDays size={ 16 } />
			</DatePicker.Trigger>

			<DatePicker.Content
				class="z-50 rounded-2xl border border-(--border) bg-(--bg-surface) p-4 shadow-(--shadow-lg) animate-in fade-in duration-200"
			>
				<DatePicker.Calendar class="w-full">
					{#snippet children({ months, weekdays })}
						<!-- Calendar Header -->
						<div class="flex items-center justify-between mb-4">
							<DatePicker.PrevButton
								class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-surface-2) transition-colors"
							>
								<ChevronLeft size={ 18 } />
							</DatePicker.PrevButton>
							
							<DatePicker.Heading class="text-sm font-semibold text-(--text-primary)" />
							
							<DatePicker.NextButton
								class="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-surface-2) transition-colors"
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
												<th class="w-8 text-center text-xs font-medium text-(--text-muted) py-1 select-none">
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
															       text-(--text-primary) hover:bg-(--bg-surface-2)
															       data-[selected]:bg-(--accent) data-[selected]:text-(--accent-text) data-[selected]:shadow-sm
															       data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed
															       data-[unavailable]:opacity-30 data-[unavailable]:cursor-not-allowed"
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
				<AlertCircle size={ 14 } class="shrink-0" />
				<span>{ error }</span>
			</div>
		{/if}
	</div>
</DatePicker.Root>
