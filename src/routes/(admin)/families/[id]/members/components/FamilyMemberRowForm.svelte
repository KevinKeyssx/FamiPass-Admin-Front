<script lang="ts">
	import type { CommunityOrganization } from '$lib/types/index.js';
	import { orgOptions }                 from '../../../utils/constants.js';
	import InputText                      from '$lib/components/ui/InputText.svelte';
	import Select                         from '$lib/components/ui/Select.svelte';
	import { Checkbox }                   from 'bits-ui';
	import { Check, X, Plus }             from '@lucide/svelte';

	interface Props {
		onSubmit : ( data: {
			full_name         : string;
			rut               : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
		} ) => Promise<boolean>;
		isSaving? : boolean;
	}

	let {
		onSubmit,
		isSaving = false
	}: Props = $props();

	let full_name         = $state( '' );
	let rut               = $state( '' );
	let phone             = $state( '' );
	let organization      = $state<CommunityOrganization>( 'NINGUNA' );
	let is_representative = $state( false );

	let errors = $state<Record<string, string | null>>( {
		full_name : null,
		rut       : null
	} );

	async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();

		errors = {
			full_name : null,
			rut       : null
		};

		let hasError = false;

		if ( !full_name.trim() ) {
			errors.full_name = 'El nombre completo es requerido.';
			hasError = true;
		}

		if ( !rut.trim() ) {
			errors.rut = 'El RUT es requerido.';
			hasError = true;
		}

		if ( hasError ) return;

		const success = await onSubmit( {
			full_name         : full_name.trim(),
			rut               : rut.trim(),
			phone             : phone.trim() || '',
			organization      : organization,
			is_representative : is_representative
		} );

		if ( success ) {
			handleClear();
		}
	}

	function handleClear(): void {
		full_name         = '';
		rut               = '';
		phone             = '';
		organization      = 'NINGUNA';
		is_representative = false;
		errors            = {
			full_name : null,
			rut       : null
		};
	}
</script>

<tr class="bg-bg-surface-2/20 hover:bg-bg-surface-2/40 transition-colors">
	<td class="px-6 py-3 text-text-primary font-semibold">
		<InputText
			placeholder="Ej: Juan Pérez"
			bind:value={ full_name }
			error={ errors.full_name }
			disabled={ isSaving }
		/>
	</td>

	<td class="px-6 py-3 text-text-secondary font-mono">
		<InputText
			placeholder="Ej: 12.345.678-9"
			bind:value={ rut }
			error={ errors.rut }
			disabled={ isSaving }
		/>
	</td>

	<td class="px-6 py-3 text-text-secondary">
		<InputText
			placeholder="Ej: +56912345678"
			bind:value={ phone }
			disabled={ isSaving }
		/>
	</td>

	<td class="px-6 py-3 text-text-secondary">
		<Select
			options={ orgOptions }
			bind:value={ organization }
			disabled={ isSaving }
		/>
	</td>

	<td class="px-6 py-3 text-center">
		<div class="flex items-center justify-center">
			<Checkbox.Root
				bind:checked={ is_representative }
				disabled={ isSaving }
				id="member-is-representative-inline"
				class="w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer
				       { is_representative
				           ? 'bg-accent border-accent text-accent-text'
				           : 'bg-bg-surface border-border hover:border-accent/40' }"
			>
				{#snippet children( { checked } )}
					{#if checked}
						<div class="animate-in zoom-in duration-200 text-accent-text">
							<Check size={ 14 } strokeWidth={ 3 } />
						</div>
					{/if}
				{/snippet}
			</Checkbox.Root>
		</div>
	</td>

	<td class="px-6 py-3">
		<div class="flex items-center justify-end gap-1.5">
			<button
				type="button"
				onclick={ handleClear }
				class="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all duration-300 cursor-pointer"
				title="Limpiar campos"
				disabled={ isSaving }
			>
				<X size={ 16 } />
			</button>

			<button
				type="button"
				onclick={ ( e: MouseEvent ) => {
					const form = ( e.target as HTMLElement ).closest( 'tr' )?.querySelector( 'form' );
					if ( form ) form.requestSubmit();
				} }
				class="p-2.5 rounded-xl bg-accent text-accent-text hover:opacity-90 transition-all duration-300 cursor-pointer"
				title="Agregar miembro"
				disabled={ isSaving }
			>
				<Plus size={ 16 } />
			</button>
		</div>
		<!-- Formulario invisible para soportar envío estándar (tecla Enter en inputs) -->
		<form onsubmit={ handleSubmit } class="hidden"></form>
	</td>
</tr>
