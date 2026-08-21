export function validateRut( rut: string ): boolean {
	if ( !rut || typeof rut !== 'string' ) {
		return false;
	}

	const cleanRut = rut.replace( /[^0-9kK]/g, '' );

	if ( cleanRut.length < 2 ) {
		return false;
	}

	const body = cleanRut.slice( 0, -1 );
	const dv   = cleanRut.slice( -1 ).toLowerCase();

	if ( !/^\d+$/.test( body ) ) {
		return false;
	}

	let sum        = 0;
	let multiplier = 2;

	for ( let i = body.length - 1; i >= 0; i-- ) {
		sum += Number( body[ i ] ) * multiplier;
		multiplier = multiplier === 7 ? 2 : multiplier + 1;
	}

	const dvr        = 11 - ( sum % 11 );
	let expectedDv = '';

	if ( dvr === 11 ) {
		expectedDv = '0';
	} else if ( dvr === 10 ) {
		expectedDv = 'k';
	} else {
		expectedDv = String( dvr );
	}

	return dv === expectedDv;
}


export function validatePhone( phone: string ): boolean {
	if ( !phone ) {
		return false;
	}

	const cleanPhone = phone.replace( /\D/g, '' );
	let numberOnly   = cleanPhone;

	if ( cleanPhone.startsWith( '56' ) && cleanPhone.length === 11 ) {
		numberOnly = cleanPhone.slice( 2 );
	}

	return /^[9]\d{8}$/.test( numberOnly );
}


export function formatPhone( phone: string ): string {
	if ( !phone ) {
		return '';
	}

	const cleanPhone = phone.replace( /\D/g, '' );
	let numberOnly   = cleanPhone;

	if ( cleanPhone.startsWith( '56' ) && cleanPhone.length === 11 ) {
		numberOnly = cleanPhone.slice( 2 );
	}

	return `+56${ numberOnly }`;
}
