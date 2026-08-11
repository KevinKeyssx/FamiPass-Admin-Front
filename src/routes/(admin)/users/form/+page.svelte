<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page }             from '$app/state';

	import { ArrowLeft, User, Building, AlertCircle } from '@lucide/svelte';

	import type { User as UserType, UserRole }  from '$lib/types/index.js';
	import { getFilteredRoleOptions }           from '../utils/contants';
	import Button                               from '$lib/components/ui/Button.svelte';
	import InputText                            from '$lib/components/ui/InputText.svelte';
	import Select                               from '$lib/components/ui/Select.svelte';
	import Checkbox                             from '$lib/components/ui/Checkbox.svelte';


	interface Props {
		data: {
			user            : UserType | null;
			currentUserRole : string | null;
		};
	}


	interface FormState {
		full_name : string;
		user_name : string;
		email     : string;
		role      : UserRole;
		phone     : string;
		is_active : boolean;
	}


	let { data }: Props = $props();


	const userId              = $derived( page.url.searchParams.get( 'id' ) );
	const isEdit              = $derived( !!userId );
	const filteredRoleOptions = $derived( getFilteredRoleOptions( data.currentUserRole ) );


	let errorMsg = $state<string | null>( null );
	let isSaving = $state( false );
	let errors   = $state<Record<string, string | null>>( {
		full_name : null,
		email     : null
	} );

	// svelte-ignore state_referenced_locally
	let form = $state<FormState>( {
		full_name	: data.user?.full_name ?? '',
		user_name	: data.user?.user_name ?? '',
		email		: data.user?.email ? data.user.email.replace( '@gmail.com', '' ) : '',
		role		: data.user?.role      ?? 'MEMBER',
		phone		: data.user?.phone     ?? '',
		is_active	: data.user?.is_active ?? true
	} );


	function handleEmailKeyDown( e: KeyboardEvent ): void {
		if ( e.key === '@' ) {
			e.preventDefault();
		}
	}


	function handleEmailPaste( e: ClipboardEvent ): void {
		e.preventDefault();

		const pastedText = e.clipboardData?.getData( 'text' ) || '';
		const cleanText  = pastedText.split( '@' )[ 0 ];
		const input      = e.target as HTMLInputElement;
		const start      = input.selectionStart || 0;
		const end        = input.selectionEnd || 0;
		const currentValue = form.email;

		form.email       = currentValue.slice( 0, start ) + cleanText + currentValue.slice( end );

		setTimeout( () => {
			input.selectionStart = input.selectionEnd = start + cleanText.length;
		}, 0 );
	}


	function handleEmailInput( e: Event ): void {
		const input = e.target as HTMLInputElement;
		const val   = input.value;

		if ( val.includes( '@' ) ) {
			form.email = val.split( '@' )[ 0 ];
		}
	}


	async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();

		errorMsg = null;

		errors = {
			full_name : null,
			email     : null
		};

		let hasError = false;

		if ( !form.full_name.trim() ) {
			errors.full_name = 'El nombre completo es requerido.';
			hasError = true;
		}

		if ( !form.email.trim() ) {
			errors.email = 'El correo electrónico es requerido.';
			hasError = true;
		}

		if ( hasError ) return;

		isSaving = true;

		const formData = new FormData();

		formData.append( 'full_name', form.full_name.trim() );
		formData.append( 'user_name', form.user_name ? form.user_name.trim() : '' );
		formData.append( 'email', form.email.trim() );
		formData.append( 'role', form.role );
		formData.append( 'phone', form.phone ? form.phone.trim() : '' );
		formData.append( 'is_active', String( form.is_active ) );

		const actionUrl = isEdit ? `?id=${ userId }&/save` : '?/save';

		try {
			const response = await fetch( actionUrl, {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:users' );

				goto( '/users' );
			} else if ( result.type === 'failure' ) {
				errorMsg = ( result.data as any )?.error ?? 'Error al guardar el usuario.';
			} else if ( result.type === 'error' ) {
				errorMsg = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			errorMsg = ( err as Error ).message;
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>{ isEdit ? 'Editar Usuario' : 'Nuevo Usuario' } — FamiPass Admin</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a
				href="/users"
				class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300"
				aria-label="Volver"
			>
				<ArrowLeft size={ 20 } />
			</a>

			<div>
				<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Usuario' : 'Nuevo Usuario' }
				</h1>

				<p class="text-sm text-text-secondary mt-1">
					{ isEdit ? `Modificando credenciales de ${ data.user?.full_name }` : 'Ingresa los datos del nuevo usuario' }
				</p>
			</div>
		</div>
	</div>

	<form onsubmit={ handleSubmit } class="space-y-6">
		<!-- Información Personal -->
		<div class="p-6 space-y-6 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
			<div class="flex items-center gap-2.5">
				<User size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />

				<h2 class="font-bold text-lg text-text-primary">Información personal</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<InputText
					label="Nombre completo"
					id="full-name"
					required={ true }
					placeholder="Ej: Juan Pérez"
					bind:value={ form.full_name }
					error={ errors.full_name }
				/>

				<div class="flex flex-col gap-1.5 w-full">
					<label for="email" class="text-sm font-medium text-text-primary select-none">
						Correo electrónico
						<span class="text-accent">*</span>
					</label>

					<div class="relative flex items-center">
						<input
							type="text"
							id="email"
							placeholder="Ej: juan.perez"
							required
							bind:value={ form.email }
							onkeydown={ handleEmailKeyDown }
							onpaste={ handleEmailPaste }
							oninput={ handleEmailInput }
							class="w-full pl-4 pr-28 py-2.5 rounded-xl border transition-all duration-300
							       bg-bg-surface-2 text-text-primary placeholder:text-text-muted
							       focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
							       { errors.email
							           ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
							           : 'border-border hover:border-accent/40' }"
						/>
						<span class="absolute right-3 text-sm font-medium text-text-muted pointer-events-none select-none">
							@gmail.com
						</span>
					</div>

					{#if errors.email}
						<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
							<AlertCircle size={ 14 } class="shrink-0" />
							<span>{ errors.email }</span>
						</div>
					{/if}
				</div>

				<InputText
					label="Nombre de usuario / Apodo (Opcional)"
					id="user-name"
					placeholder="Ej: juan.perez"
					bind:value={ form.user_name }
				/>

				<InputText
					label="Teléfono de contacto (Opcional)"
					id="phone"
					placeholder="Ej: +56912345678"
					bind:value={ form.phone }
				/>
			</div>

            <Select
                label="Rol del sistema"
                placeholder="Selecciona el rol"
                required={ true }
                options={ filteredRoleOptions }
                bind:value={ form.role }
            />
		</div>

		<!-- Ajustes adicionales -->
		<div class="p-6 space-y-6 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
			<div class="flex items-center gap-2.5">
				<Building size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
				<h2 class="font-bold text-lg text-text-primary">Ajustes de cuenta</h2>
			</div>

			<Checkbox
				label="Usuario activo"
				description="Permite al usuario ingresar y participar en los eventos"
				id="is-active"
				bind:checked={ form.is_active }
			/>
		</div>

		{#if errorMsg}
			<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
				{ errorMsg }
			</div>
		{/if}

		<div class="flex gap-3 justify-end">
			<a href="/users">
				<Button variant="secondary" class="hover:text-accent hover:bg-accent-muted/30 transition-all duration-300">
					Cancelar
				</Button>
			</a>

			<Button
				type="submit"
				variant="primary"
				loading={ isSaving }
			>
				{ isEdit ? 'Guardar Cambios' : 'Crear Usuario' }
			</Button>
		</div>
	</form>
</div>
