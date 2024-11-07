export default function Debounce(func: Function, delay: number) {
	let timeout: NodeJS.Timeout;
	return function (...args: any) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
}
module.exports = exports.default;