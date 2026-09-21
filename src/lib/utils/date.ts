export function isEventExpired( expiresAt: string | null | undefined ): boolean {
	if ( !expiresAt ) {
		return false;
	}

	const now   = new Date();
	const year  = now.getFullYear();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day   = String( now.getDate() ).padStart( 2, '0' );
	const today = `${ year }-${ month }-${ day }`;

	return today > expiresAt;
}

export function hasEventStarted( eventDate: string | null | undefined ): boolean {
	if ( !eventDate ) {
		return false;
	}

	const now   = new Date();
	const year  = now.getFullYear();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day   = String( now.getDate() ).padStart( 2, '0' );
	const today = `${ year }-${ month }-${ day }`;

	return today >= eventDate.slice( 0, 10 );
}

