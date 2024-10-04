module.exports = function (input, strings) {
	let minDistance = Number.MAX_VALUE;
	let closestMatch = null;

	if (typeof input !== 'string') throw new TypeError('Input must be a string');
	if (!Array.isArray(strings)) throw new TypeError('Strings must be an array');
	if (strings.some(s => typeof s !== 'string')) throw new TypeError('Strings must only contain strings');

	if (strings.length === 0) return null;
	if (strings.length === 1) return strings[0];

	for (let i = 0; i < strings.length; i++) {
		const distance = levenshteinDistance(input, strings[i]);
		if (distance < minDistance) {
			minDistance = distance;
			closestMatch = strings[i];
		}
	}

	return closestMatch;
}

function levenshteinDistance(a, b) {
	const matrix = Array(a.length + 1)
		.fill(0)
		.map(() => Array(b.length + 1).fill(0));

	for (let i = 0; i <= a.length; i++) {
		matrix[i][0] = i;
	}

	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			if (a[i - 1] === b[j - 1]) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,	// substitution
					matrix[i][j - 1] + 1,		// insertion
					matrix[i - 1][j] + 1,		// deletion
				);
			}
		}
	}

	return matrix[a.length][b.length];
}