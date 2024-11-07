// This is an exremely simple and lightweight hash algorithm called CRC32
// You should never use this to store passwords or any sensitive data
// This is only useful for checking if data has been modified or corrupted

module.exports = function crc32(str) {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
		}
		table[i] = c;
	}

	let crc = 0 ^ -1;
	for (let i = 0; i < str.length; i++) {
		crc = table[(crc ^ str.charCodeAt(i)) & 0xff] ^ crc >>> 8;
	}

	const hash = (crc ^ -1) >>> 0;
	return hash.toString(16).padStart(8, '0');
}