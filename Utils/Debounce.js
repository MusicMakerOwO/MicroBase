module.exports = function Debounce(func, delay) {
	let timeout = null;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
}