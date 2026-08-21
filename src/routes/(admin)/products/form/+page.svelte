<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page }             from '$app/state';

    import { Package, Bolt, Trash2 } from '@lucide/svelte';

	import type { Product } from '$lib/types/index.js';
	import Button           from '$lib/components/ui/Button.svelte';
	import Modal            from '$lib/components/ui/Modal.svelte';
	import InputText        from '$lib/components/ui/InputText.svelte';
	import Checkbox         from '$lib/components/ui/Checkbox.svelte';
	import ButtonBack       from '$lib/components/ui/ButtonBack.svelte';


    interface Props {
		data: {
			product : Product | null;
		};
	}


    let { data }: Props = $props();


    const productId = $derived( page.url.searchParams.get( 'id' ) );
	const isEdit    = $derived( !!productId );


	interface FormState {
		name        : string;
		description : string;
		is_active   : boolean;
	}

	// svelte-ignore state_referenced_locally
	let form = $state<FormState>( {
		name        : data.product?.name        ?? '',
		description : data.product?.description ?? '',
		is_active   : data.product?.is_active   ?? true
	} );


    let errorMsg        = $state<string | null>( null );
	let isSaving        = $state( false );
	let deleteModalOpen = $state( false );
	let deleteError     = $state<string | null>( null );
	let isDeleting      = $state( false );
	let errors = $state<Record<string, string | null>>( {
		name : null
	} );


    async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();

        errorMsg = null;

		errors = {
			name : null
		};

		let hasError = false;

		if ( !form.name.trim() ) {
			errors.name = 'El nombre del producto es requerido.';
			hasError    = true;
		}

		if ( hasError ) return;

		isSaving = true;

		const formData = new FormData();

        formData.append( 'name', form.name.trim() );
		formData.append( 'description', form.description.trim() );
		formData.append( 'is_active', String( form.is_active ) );

		const actionUrl = isEdit ? `?id=${ productId }&/save` : '?/save';

		try {
			const response = await fetch( actionUrl, {
				method : 'POST',
				body   : formData
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				const product = ( result.data as any )?.product;

				if ( product ) {
					await invalidate( 'app:products' );
					goto( '/products' );
				} else {
					errorMsg = 'No se recibió la información del producto procesado.';
				}
			} else if ( result.type === 'failure' ) {
				errorMsg = ( result.data as any )?.error ?? 'Error al guardar el producto.';
			} else if ( result.type === 'error' ) {
				errorMsg = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			errorMsg = ( err as Error ).message;
		} finally {
			isSaving = false;
		}
	}


    async function confirmDelete(): Promise<void> {
		if ( !productId ) return;

		isDeleting  = true;
		deleteError = null;

		try {
			const response = await fetch( `?/delete&id=${ productId }`, {
				method : 'POST'
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:products' );

                deleteModalOpen = false;

                goto( '/products' );
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error ?? 'Error al eliminar el producto.';
			} else if ( result.type === 'error' ) {
				deleteError = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			deleteError = ( err as Error ).message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>{ isEdit ? 'Editar Producto' : 'Nuevo Producto' } — FamiPass Admin</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/products" />

			<div class="space-y-0.5">
				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }
				</h1>

				<p class="text-xs text-text-secondary">
					{ isEdit ? 'Modifica los campos del producto seleccionado' : 'Ingresa la información básica del nuevo producto' }
				</p>
			</div>
		</div>

		{#if isEdit }
			<div class="relative z-10 shrink-0">
				<Button
					variant="danger"
					size="sm"
					onclick={() => { deleteModalOpen = true; }}
					disabled={ isSaving }
				>
					<Trash2 size={ 16 } />
					Eliminar Producto
				</Button>
			</div>
		{/if}
	</div>

	<!-- Form Layout -->
	<form onsubmit={ handleSubmit } class="space-y-6">
		<div class="form-card relative">
			<!-- Configuration Section -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 pb-3 border-b border-(--border)/40">
					<Package size={ 18 } class="text-(--accent)" />

                    <h2 class="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
						Datos del Producto
					</h2>
				</div>

				<div class="grid grid-cols-1 gap-6">
					<!-- Name -->
					<InputText
						bind:value={ form.name }
						label="Nombre del Producto"
						placeholder="Ej: Bebida Cola 1.5L"
						error={ errors.name }
						disabled={ isSaving }
					/>

					<!-- Description -->
					<InputText
						bind:value={ form.description }
						label="Descripción"
						placeholder="Detalle o notas adicionales del producto..."
						disabled={ isSaving }
					/>
				</div>
			</div>

			<!-- Limits & Controls Section -->
			<div class="space-y-4 pt-4 border-t border-(--border)/40">
				<div class="flex items-center gap-2 pb-3 border-b border-(--border)/40">
					<Bolt size={ 18 } class="text-(--accent)" />

                    <h2 class="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
						Configuración y Límites
					</h2>
				</div>

				<div class="grid grid-cols-1 gap-6">
					<!-- Status Switch -->
					<Checkbox
						bind:checked={ form.is_active }
						label="Producto Activo"
						description="Indica si el producto estará disponible para nuevos eventos."
						disabled={ isSaving }
					/>
				</div>
			</div>
		</div>

		<!-- Error Feedback -->
		{#if errorMsg }
			<div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
				{ errorMsg }
			</div>
		{/if}

		<!-- Submit Buttons -->
		<div class="flex justify-end gap-3">
			<a href="/products">
				<Button variant="secondary" disabled={ isSaving }>
					Cancelar
				</Button>
			</a>

            <Button type="submit" loading={ isSaving }>
				{ isEdit ? 'Guardar Cambios' : 'Crear Producto' }
			</Button>
		</div>
	</form>
</div>

<!-- Confirm Delete Modal -->
<Modal
	open={ deleteModalOpen }
	title="Eliminar producto"
	onClose={() => { deleteModalOpen = false; deleteError = null; }}
	onConfirm={ confirmDelete }
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar el producto <strong class="text-(--text-primary)">"{ form.name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción eliminará de forma permanente el producto. No se puede deshacer.</p>
	{#if deleteError }
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
