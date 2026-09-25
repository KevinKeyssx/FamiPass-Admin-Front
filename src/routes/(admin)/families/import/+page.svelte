<script lang="ts">
	import { goto }        from '$app/navigation';
	import { deserialize } from '$app/forms';

    import {
		FileSpreadsheet,
		UploadCloud,
		Users,
		CheckCircle2,
		AlertCircle,
		Trash2,
		Search,
		RotateCcw,
		Sparkles,
		Building2,
		FileUp,
		Check
	}                                   from '@lucide/svelte';
	import { Checkbox as BitsCheckbox } from 'bits-ui';
	import * as XLSX                    from 'xlsx';

	import type {
		ParsedMemberRow,
		FamilyGroupItem,
		ImportPayload,
		ImportResult,
		ExistingFamilyLookup
	}                           from '$lib/types/index.js';
	import {
		orgOptions,
		familyRoleOptions
	}                           from '../utils/constants.js';
	import type { PageData }    from './$types.js';
	import ButtonBack           from '$lib/components/ui/ButtonBack.svelte';
	import Button               from '$lib/components/ui/Button.svelte';
	import Select               from '$lib/components/ui/Select.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';


	interface Props {
		data : PageData;
	}

	let { data } : Props = $props();

	let fileInputRef    = $state<HTMLInputElement | null>( null );
	let isDragging      = $state( false );
	let isReading       = $state( false );
	let isImporting     = $state( false );
	let fileName        = $state<string | null>( null );
	let fileSize        = $state<string | null>( null );
	let parseError      = $state<string | null>( null );
	let importError     = $state<string | null>( null );
	let searchFilter    = $state( '' );

	let parsedMembers   = $state<ParsedMemberRow[]>( [] );
	let familyActions   = $state<Record<string, { action : 'create' | 'link'; existingId : string | null; existingCode : number | null }>>( {} );

	let successModalOpen   = $state( false );
	let successModalResult = $state<ImportResult | null>( null );


	const existingFamiliesMap = $derived.by( () => {
		const map = new Map<string, ExistingFamilyLookup>();
		for ( const fam of data.existingFamilies ) {
			map.set( fam.family_name.trim().toLowerCase(), fam );
		}
		return map;
	} );

	const filteredMembers = $derived.by( () => {
		if ( !searchFilter.trim() ) {
			return parsedMembers;
		}

		const query = searchFilter.trim().toLowerCase();
		return parsedMembers.filter( ( m ) =>
			m.full_name.toLowerCase().includes( query ) ||
			m.family_name.toLowerCase().includes( query ) ||
			( m.rut && m.rut.toLowerCase().includes( query ) ) ||
			( m.phone && m.phone.toLowerCase().includes( query ) )
		);
	} );

	const uniqueFamilyNames = $derived.by( () => {
		const names = new Set<string>();
		for ( const m of parsedMembers ) {
			if ( m.family_name ) {
				names.add( m.family_name );
			}
		}
		return Array.from( names );
	} );

	const summaryStats = $derived.by( () => {
		let newCount    = 0;
		let linkedCount = 0;

		for ( const name of uniqueFamilyNames ) {
			const actionConfig = familyActions[ name ];
			if ( actionConfig && actionConfig.action === 'link' ) {
				linkedCount++;
			} else {
				newCount++;
			}
		}

		return {
			totalMembers   : parsedMembers.length,
			totalFamilies  : uniqueFamilyNames.length,
			newFamilies    : newCount,
			linkedFamilies : linkedCount
		};
	} );


	function formatFileSize( bytes : number ) : string {
		if ( bytes < 1024 ) return `${ bytes } B`;
		if ( bytes < 1024 * 1024 ) return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
		return `${ ( bytes / ( 1024 * 1024 ) ).toFixed( 1 ) } MB`;
	}

	const MAX_FILE_SIZE_MB    = 10;
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	async function processFile( file : File ) : Promise<void> {
		if ( !file.name.endsWith( '.xlsx' ) && !file.name.endsWith( '.xls' ) ) {
			parseError = 'Por favor selecciona un archivo Excel válido (.xlsx o .xls).';
			return;
		}

		if ( file.size > MAX_FILE_SIZE_BYTES ) {
			parseError = `El archivo es demasiado pesado (${ formatFileSize( file.size ) }). El tamaño máximo permitido es de ${ MAX_FILE_SIZE_MB } MB.`;
			return;
		}

		parseError  = null;
		importError = null;
		isReading   = true;
		fileName    = file.name;
		fileSize    = formatFileSize( file.size );

		try {
			const buffer    = await file.arrayBuffer();
			const workbook  = XLSX.read( buffer, { type : 'array' } );
			const sheetName = workbook.SheetNames[ 0 ];

			if ( !sheetName ) {
				throw new Error( 'El archivo Excel no contiene hojas de cálculo.' );
			}

			const worksheet = workbook.Sheets[ sheetName ];
			const rows      = XLSX.utils.sheet_to_json<any[]>( worksheet, { header : 1 } );

			if ( !rows || rows.length === 0 ) {
				throw new Error( 'La hoja seleccionada está vacía.' );
			}

			const membersList : ParsedMemberRow[] = [];
			const actionsMap  : Record<string, { action : 'create' | 'link'; existingId : string | null; existingCode : number | null }> = {};

			let startIndex = 0;
			if ( rows.length > 0 ) {
				const firstCol0 = String( rows[ 0 ][ 0 ] || '' ).trim().toLowerCase();
				const firstCol1 = String( rows[ 0 ][ 1 ] || '' ).trim().toLowerCase();

                if (
					firstCol0.includes( 'nombre' ) ||
					firstCol0.includes( 'miembro' ) ||
					firstCol1.includes( 'familia' ) ||
					firstCol1.includes( 'apellido' )
				) {
					startIndex = 1;
				}
			}

			for ( let i = startIndex; i < rows.length; i++ ) {
				const row = rows[ i ];

                if ( !row || row.length === 0 ) continue;

				const colA = String( row[ 0 ] ?? '' ).trim();
				const colB = String( row[ 1 ] ?? '' ).trim();

				if ( !colA && !colB ) continue;

				const memberName = colA;
				const familyName = colB || 'Sin Familia';

				if ( !memberName ) continue;

				membersList.push({
					temp_id           : crypto.randomUUID(),
					full_name         : memberName,
					family_name       : familyName,
					rut               : '',
					phone             : '',
					email             : '',
					organization      : 'NINGUNA',
					is_representative : true,
					role              : 'ADMIN'
				});

				if ( !actionsMap[ familyName ] ) {
					const existing = existingFamiliesMap.get( familyName.toLowerCase() );

                    if ( existing ) {
						actionsMap[ familyName ] = {
							action       : 'link',
							existingId   : existing.id,
							existingCode : existing.code
						};
					} else {
						actionsMap[ familyName ] = {
							action       : 'create',
							existingId   : null,
							existingCode : null
						};
					}
				}
			}

			if ( membersList.length === 0 ) {
				throw new Error( 'No se encontraron registros válidos de miembros en el archivo.' );
			}

			parsedMembers = membersList;
			familyActions = actionsMap;
		} catch ( err : any ) {
			parseError    = err.message || 'Error al procesar el archivo Excel.';
			parsedMembers = [];
			familyActions = {};
		} finally {
			isReading = false;
		}
	}

	function handleFileSelect( event : Event ) : void {
		const target = event.target as HTMLInputElement;
		const file   = target.files?.[ 0 ];
		if ( file ) {
			processFile( file );
		}
	}

	function handleDragOver( event : DragEvent ) : void {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave( event : DragEvent ) : void {
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop( event : DragEvent ) : void {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files?.[ 0 ];
		if ( file ) {
			processFile( file );
		}
	}

	function resetFile() : void {
		parsedMembers      = [];
		familyActions      = {};
		fileName           = null;
		fileSize           = null;
		parseError         = null;
		importError        = null;
		searchFilter       = '';
		if ( fileInputRef ) {
			fileInputRef.value = '';
		}
	}

	function removeMember( tempId : string ) : void {
		parsedMembers = parsedMembers.filter( ( m ) => m.temp_id !== tempId );
	}

	function setAllRepresentatives( status : boolean ) : void {
		for ( const m of parsedMembers ) {
			m.is_representative = status;
		}
	}

	async function submitImport() : Promise<void> {
		if ( parsedMembers.length === 0 ) return;

		for ( const m of parsedMembers ) {
			if ( !m.full_name.trim() ) {
				importError = 'Hay filas con el nombre del integrante vacío. Por favor complétalo o elimina la fila.';
				return;
			}
		}

		isImporting = true;
		importError = null;

		const groupsMap = new Map<string, FamilyGroupItem>();

		for ( const member of parsedMembers ) {
			const famName = member.family_name.trim();
			if ( !groupsMap.has( famName ) ) {
				const famConfig = familyActions[ famName ] || {
					action     : 'create',
					existingId : null
				};

				groupsMap.set( famName, {
					family_name        : famName,
					action             : famConfig.action,
					existing_family_id : famConfig.existingId,
					members            : []
				} );
			}

			const group = groupsMap.get( famName )!;
			group.members.push({
				full_name         : member.full_name.trim(),
				rut               : member.rut?.trim() || null,
				phone             : member.phone?.trim() || null,
				email             : member.email?.trim() || null,
				organization      : member.organization || 'NINGUNA',
				is_representative : member.is_representative ?? true,
				role              : member.role || 'ADMIN'
			});
		}

		const payload : ImportPayload = {
			groups : Array.from( groupsMap.values() )
		};

		const formData = new FormData();
		formData.append( 'payload', JSON.stringify( payload ) );

		try {
			const response = await fetch( '?/import', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				successModalResult = ( result.data as any )?.result || {
					success          : true,
					families_created : summaryStats.newFamilies,
					families_linked  : summaryStats.linkedFamilies,
					members_created  : parsedMembers.length
				};
				successModalOpen = true;
			} else if ( result.type === 'failure' ) {
				importError = ( result.data as any )?.error || 'Error al procesar la importación.';
			} else {
				importError = 'Ocurrió un error inesperado durante la importación.';
			}
		} catch ( err : any ) {
			importError = err.message || 'Error de red al intentar importar.';
		} finally {
			isImporting = false;
		}
	}
</script>

<svelte:head>
	<title>Importar Familias y Miembros — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Encabezado con Botón Volver -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<div class="flex items-center gap-3">
				<ButtonBack href="/families" label="Volver a Familias" />

				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					Importación Masiva de Familias
				</h1>
			</div>

			<p class="text-xs text-text-secondary mt-1">
				Sube un archivo Excel para crear familias y sus integrantes automáticamente con previsualización editable.
			</p>
		</div>

		<div class="relative z-10 shrink-0">
			{#if parsedMembers.length > 0}
				<div class="flex items-center gap-2.5">
					{#if fileName && fileSize}
						<div class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface-2 border border-border text-xs text-text-secondary">
							<FileSpreadsheet size={ 14 } class="text-accent shrink-0" />
							<span class="font-medium text-text-primary truncate max-w-40" title={ fileName }>{ fileName }</span>
							<span class="text-text-muted font-mono text-[11px]">({ fileSize })</span>
						</div>
					{/if}

					<Button
						variant="secondary"
						onclick={ resetFile }
						disabled={ isImporting }
						class="border border-border/80 hover:bg-bg-surface-2 gap-2 text-xs"
					>
						<RotateCcw size={ 14 } />
						Cargar otro archivo
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Paso 1: Dropzone de Carga si no hay archivo procesado -->
	{#if parsedMembers.length === 0}
		<div class="form-card !p-8">
			<div
				class="border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
					{ isDragging
						? 'border-accent bg-accent/5 ring-4 ring-accent/10'
						: 'border-border/80 hover:border-accent/60 bg-bg-surface-2/40 hover:bg-bg-surface-2/80' }"
				ondragover={ handleDragOver }
				ondragleave={ handleDragLeave }
				ondrop={ handleDrop }
				onclick={ () => fileInputRef?.click() }
				role="button"
				tabindex="0"
				onkeydown={ ( e ) => { if ( e.key === 'Enter' || e.key === ' ' ) fileInputRef?.click(); } }
			>
				<input
					bind:this={ fileInputRef }
					type="file"
					accept=".xlsx, .xls"
					class="hidden"
					onchange={ handleFileSelect }
				/>

				<div class="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
					{#if isReading}
						<div class="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<UploadCloud size={ 32 } />
					{/if}
				</div>

				<h2 class="text-base font-bold text-text-primary mb-1">
					{ isReading ? 'Procesando archivo Excel...' : 'Arrastra tu archivo Excel aquí o haz clic para examinar' }
				</h2>

				<p class="text-xs text-text-muted max-w-md mb-6">
					Compatible con formatos <strong class="text-text-primary">.xlsx</strong> y <strong class="text-text-primary">.xls</strong> (máx. 10 MB).
					El sistema agrupará a cada integrante según el nombre de familia indicado en la segunda columna.
				</p>

				<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs text-text-secondary">
					<FileSpreadsheet size={ 14 } class="text-accent" />
					<span>Formato sugerido: <strong>Columna A:</strong> Nombre Integrante | <strong>Columna B:</strong> Nombre Familia</span>
				</div>
			</div>

			{#if parseError}
				<div class="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-500 text-sm animate-in fade-in duration-200">
					<AlertCircle size={ 18 } class="shrink-0 mt-0.5" />
					<div>
						<strong class="font-semibold">Error de lectura:</strong>
						<p class="text-xs mt-0.5">{ parseError }</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Paso 2: Resumen y Métricas -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
			<div class="form-card !p-3.5 flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
					<Users size={ 20 } />
				</div>

				<div class="min-w-0">
					<p class="text-xs text-text-muted truncate">Integrantes</p>
					<p class="text-xl font-black text-text-primary tracking-tight">{ summaryStats.totalMembers }</p>
				</div>
			</div>

			<div class="form-card !p-3.5 flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
					<Building2 size={ 20 } />
				</div>

				<div class="min-w-0">
					<p class="text-xs text-text-muted truncate">Familias Nuevas</p>
					<p class="text-xl font-black text-emerald-400 tracking-tight">{ summaryStats.newFamilies }</p>
				</div>
			</div>

			<div class="form-card !p-3.5 flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
					<Sparkles size={ 20 } />
				</div>

				<div class="min-w-0">
					<p class="text-xs text-text-muted truncate">Familias a Vincular</p>
					<p class="text-xl font-black text-amber-400 tracking-tight">{ summaryStats.linkedFamilies }</p>
				</div>
			</div>

			<div class="form-card !p-3.5 flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
					<FileSpreadsheet size={ 20 } />
				</div>

				<div class="min-w-0">
					<div class="flex items-center justify-between gap-1">
						<p class="text-xs text-text-muted truncate">Archivo</p>
						{#if fileSize}
							<span class="text-[10px] text-text-muted font-medium shrink-0 font-mono">({ fileSize })</span>
						{/if}
					</div>

					<p class="text-xs font-semibold text-text-primary truncate" title={ fileName || '' }>{ fileName }</p>
				</div>
			</div>
		</div>

		<!-- Alerta si hay familias existentes detectadas -->
		{#if summaryStats.linkedFamilies > 0}
			<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
				<Building2 size={ 16 } class="text-amber-400 shrink-0 mt-0.5" />
				<div>
					<strong class="font-semibold text-amber-300">Se detectaron familias existentes en el sistema:</strong>
					<p class="mt-0.5 text-amber-300/80">
						Puedes elegir directamente en cada familia si deseas vincular los nuevos integrantes a la familia ya existente o crear una familia independiente con un código nuevo.
					</p>
				</div>
			</div>
		{/if}

		<!-- Barra de Herramientas y Filtro de Búsqueda -->
		<div class="form-card !p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
			<div class="relative w-full sm:max-w-sm">
				<Search size={ 15 } class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
				<input
					type="text"
					bind:value={ searchFilter }
					placeholder="Buscar por integrante o familia..."
					class="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-bg-surface-2 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
				/>
			</div>

			<div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
				<span class="text-xs text-text-muted mr-1">Representantes:</span>

				<button
					type="button"
					onclick={ () => setAllRepresentatives( true ) }
					class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-bg-surface-2 hover:border-accent/40 text-text-primary transition-colors cursor-pointer"
				>
					Marcar todos
				</button>

				<button
					type="button"
					onclick={ () => setAllRepresentatives( false ) }
					class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-bg-surface-2 hover:border-accent/40 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
				>
					Desmarcar todos
				</button>
			</div>
		</div>

		<!-- Tabla Interactiva de Previsualización y Edición -->
		<div class="form-card !p-0 overflow-hidden border border-border shadow-xs">
			<div class="overflow-x-auto max-h-[600px] overflow-y-auto">
				<table class="w-full text-left text-xs border-collapse">
					<thead class="sticky top-0 z-20 bg-bg-surface-2 text-text-muted uppercase tracking-wider text-[11px] font-semibold border-b border-border shadow-xs">
						<tr>
							<th class="px-3.5 py-3 w-10 text-center">#</th>
							<th class="px-3.5 py-3 min-w-44">Familia Asignada</th>
							<th class="px-3.5 py-3 min-w-56">Nombre Completo *</th>
							<th class="px-3.5 py-3 min-w-32">RUT</th>
							<th class="px-3.5 py-3 min-w-32">Teléfono</th>
							<th class="px-3.5 py-3 min-w-44">Correo Electrónico</th>
							<th class="px-3.5 py-3 min-w-40">Organización</th>
							<th class="px-3.5 py-3 min-w-32 text-center">Representante</th>
							<th class="px-3.5 py-3 min-w-44">Rol</th>
							<th class="px-3.5 py-3 w-12 text-center"></th>
						</tr>
					</thead>

					<tbody class="divide-y divide-border/60 bg-bg-surface">
						{#each filteredMembers as member, index (member.temp_id)}
							{@const famConfig = familyActions[ member.family_name ]}
							<tr class="hover:bg-bg-surface-2/40 transition-colors group">
								<!-- Número -->
								<td class="px-3.5 py-2.5 text-center text-text-muted text-[11px] select-none font-mono">
									{ index + 1 }
								</td>

								<!-- Familia -->
								<td class="px-3.5 py-2.5">
									<div class="space-y-1">
										<span class="font-semibold text-text-primary block truncate max-w-48" title={ member.family_name }>
											{ member.family_name }
										</span>

										{#if famConfig && famConfig.existingId}
											<div class="flex items-center gap-1.5">
												<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
													Coincide #{ famConfig.existingCode }
												</span>

												<select
													bind:value={ famConfig.action }
													class="text-[11px] py-0.5 px-1.5 rounded border border-border bg-bg-surface-2 text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
												>
													<option value="link">Vincular</option>
													<option value="create">Crear nueva</option>
												</select>
											</div>
										{:else}
											<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
												Nueva
											</span>
										{/if}
									</div>
								</td>

								<!-- Nombre Completo -->
								<td class="px-3.5 py-2.5">
									<input
										type="text"
										bind:value={ member.full_name }
										placeholder="Nombre del integrante"
										class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-bg-surface-2 border border-border/80 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 { !member.full_name.trim() ? 'border-red-500 bg-red-500/5' : '' }"
									/>
								</td>

								<!-- RUT -->
								<td class="px-3.5 py-2.5">
									<input
										type="text"
										bind:value={ member.rut }
										placeholder="Opcional"
										class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-bg-surface-2 border border-border/80 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 font-mono"
									/>
								</td>

								<!-- Teléfono -->
								<td class="px-3.5 py-2.5">
									<input
										type="text"
										bind:value={ member.phone }
										placeholder="Ej: 912345678"
										class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-bg-surface-2 border border-border/80 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
									/>
								</td>

								<!-- Correo Electrónico -->
								<td class="px-3.5 py-2.5">
									<input
										type="email"
										bind:value={ member.email }
										placeholder="correo@ejemplo.com"
										class="w-full px-2.5 py-1.5 rounded-lg text-xs bg-bg-surface-2 border border-border/80 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
									/>
								</td>

								<!-- Organización -->
								<td class="px-3.5 py-2.5">
									<Select
										options={ orgOptions }
										bind:value={ member.organization }
										size="small"
									/>
								</td>

								<!-- Representante -->
								<td class="px-3.5 py-2.5 text-center">
									<div class="flex justify-center">
										<BitsCheckbox.Root
											id={ `rep-${ member.temp_id }` }
											bind:checked={ member.is_representative }
											class="w-5 h-5 min-w-5 min-h-5 rounded-md border flex items-center justify-center transition-all duration-200 cursor-pointer { member.is_representative ? 'bg-accent border-accent text-accent-text' : 'bg-bg-surface-2 border-border hover:border-accent/40' }"
										>
											{#snippet children( { checked } )}
												{#if checked}
													<div class="text-accent-text">
														<Check size={ 13 } strokeWidth={ 3 } />
													</div>
												{/if}
											{/snippet}
										</BitsCheckbox.Root>
									</div>
								</td>

								<!-- Rol -->
								<td class="px-3.5 py-2.5">
									<Select
										options={ familyRoleOptions }
										bind:value={ member.role }
										size="small"
									/>
								</td>

								<!-- Acción: Eliminar -->
								<td class="px-3.5 py-2.5 text-center">
									<button
										type="button"
										onclick={ () => removeMember( member.temp_id ) }
										title="Eliminar fila"
										class="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
									>
										<Trash2 size={ 14 } />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Error al importar -->
		{#if importError}
			<div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-500 text-xs animate-in fade-in duration-200">
				<AlertCircle size={ 16 } class="shrink-0 mt-0.5" />
				<div>
					<strong class="font-semibold">Error al importar datos:</strong>
					<p class="mt-0.5">{ importError }</p>
				</div>
			</div>
		{/if}

		<!-- Barra de Acciones Inferior -->
		<div class="form-card !p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-30 shadow-xl border border-border">
			<div class="text-xs text-text-secondary text-center sm:text-left">
				Se registrarán <strong class="text-text-primary">{ summaryStats.totalMembers } integrantes</strong> distribuidos en <strong class="text-text-primary">{ summaryStats.totalFamilies } grupos familiares</strong>.
			</div>

			<div class="flex items-center gap-3 w-full sm:w-auto justify-end">
				<Button
					variant="secondary"
					onclick={ resetFile }
					disabled={ isImporting }
					class="border border-border/80 hover:bg-bg-surface-2"
				>
					Cancelar
				</Button>

				<Button
					variant="primary"
					onclick={ submitImport }
					loading={ isImporting }
					class="gap-2 px-5"
				>
					<FileUp size={ 16 } />
					Confirmar e Importar
				</Button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal de Éxito al Importar -->
<Modal
	open            = { successModalOpen }
	onClose         = { () => { successModalOpen = false; goto( '/families' ); } }
	onConfirm       = { () => { successModalOpen = false; goto( '/families' ); } }
	title           = "¡Importación Exitosa!"
	confirmLabel    = "Ir al Listado de Familias"
	confirmVariant  = "primary"
>
	<div class="space-y-4 py-2 text-xs">
		<div class="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
			<CheckCircle2 size={ 24 } class="shrink-0" />
			<div>
				<p class="font-bold text-sm text-emerald-300">Datos procesados correctamente</p>
				<p class="text-text-muted mt-0.5">Las familias y sus miembros han sido guardados en el sistema.</p>
			</div>
		</div>

		{#if successModalResult}
			<div class="grid grid-cols-3 gap-2.5 text-center">
				<div class="p-3 rounded-xl bg-bg-surface-2 border border-border">
					<p class="text-text-muted text-[11px]">Familias Creadas</p>
					<p class="text-lg font-black text-text-primary mt-0.5">{ successModalResult.families_created }</p>
				</div>

				<div class="p-3 rounded-xl bg-bg-surface-2 border border-border">
					<p class="text-text-muted text-[11px]">Familias Vinculadas</p>
					<p class="text-lg font-black text-amber-400 mt-0.5">{ successModalResult.families_linked }</p>
				</div>

				<div class="p-3 rounded-xl bg-bg-surface-2 border border-border">
					<p class="text-text-muted text-[11px]">Miembros Registrados</p>
					<p class="text-lg font-black text-accent mt-0.5">{ successModalResult.members_created }</p>
				</div>
			</div>
		{/if}
	</div>
</Modal>
