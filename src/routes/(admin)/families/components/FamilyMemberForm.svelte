<script lang="ts">
	import type { FamilyMember, CommunityOrganization } from '$lib/types/index.js';
	import { orgOptions } from '../utils/constants';
	import InputText      from '$lib/components/ui/InputText.svelte';
	import Select         from '$lib/components/ui/Select.svelte';
	import Checkbox       from '$lib/components/ui/Checkbox.svelte';
	import Button         from '$lib/components/ui/Button.svelte';


	interface Props {
		member?      : FamilyMember | null;
		onSubmit     : ( data: {
			full_name         : string;
			rut               : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
		} ) => void;
		onCancel?    : () => void;
		submitLabel? : string;
	}


	let {
		member = null,
		onSubmit,
		onCancel = () => {},
		submitLabel = 'Guardar'
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let full_name         = $state( member?.full_name ?? '' );
	// svelte-ignore state_referenced_locally
	let rut               = $state( member?.rut ?? '' );
	// svelte-ignore state_referenced_locally
	let phone             = $state( member?.phone ?? '' );
	// svelte-ignore state_referenced_locally
	let organization      = $state<CommunityOrganization>( member?.organization ?? 'NINGUNA' );
	// svelte-ignore state_referenced_locally
	let is_representative = $state( member?.is_representative ?? false );

	let errors = $state<Record<string, string | null>>( {
		full_name : null,
		rut       : null
	} );


	function handleFormSubmit( e: SubmitEvent ): void {
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

		onSubmit( {
			full_name         : full_name.trim(),
			rut               : rut.trim(),
			phone             : phone.trim() || '',
			organization,
			is_representative
		} );
	}
</script>

<form onsubmit={ handleFormSubmit } class="space-y-4">
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<InputText
			label="Nombre completo"
			id="member-full-name"
			required={ true }
			placeholder="Ej: Juan Pérez"
			bind:value={ full_name }
			error={ errors.full_name }
		/>

		<InputText
			label="RUT"
			id="member-rut"
			required={ true }
			placeholder="Ej: 12.345.678-9"
			bind:value={ rut }
			error={ errors.rut }
		/>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<InputText
			label="Teléfono de contacto (Opcional)"
			id="member-phone"
			placeholder="Ej: +56912345678"
			bind:value={ phone }
		/>

		<Select
			label="Organización comunitaria"
			required={ true }
			options={ orgOptions }
			bind:value={ organization }
		/>
	</div>

	<div class="pt-2 border-t border-border/40">
		<Checkbox
			label="Representante familiar"
			description="Determina si este miembro es el principal encargado de la cuenta familiar"
			id="member-is-representative"
			bind:checked={ is_representative }
		/>
	</div>

	<div class="flex gap-3 justify-end pt-4">
		<Button type="button" variant="secondary" onclick={ onCancel } class="hover:bg-accent-muted/30 transition-all duration-300">
			Cancelar
		</Button>

		<Button type="submit" variant="primary">
			{ submitLabel }
		</Button>
	</div>
</form>
