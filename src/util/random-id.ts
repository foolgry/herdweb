/**
 * Protocol ids handed to the ws handshake (requestId, nonce, actionId).
 *
 * `crypto.randomUUID()` only exists in secure contexts, so it is missing on a
 * plain-HTTP LAN origin such as `http://192.168.1.248:7682`. Calling it threw
 * inside beginAttach, which aborted the handshake and left the client stuck on
 * "Syncing…" with no error the user could act on. `crypto.getRandomValues()`
 * carries no such restriction, so assemble a v4 by hand when randomUUID is absent.
 */
export function randomId(): string {
	const source = globalThis.crypto
	if (typeof source?.randomUUID === 'function') return source.randomUUID()
	const bytes = source.getRandomValues(new Uint8Array(16))
	// RFC 4122 v4: pin the version nibble and variant bits. Indexed access is
	// optional under noUncheckedIndexedAccess, hence the `?? 0` fallbacks.
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
