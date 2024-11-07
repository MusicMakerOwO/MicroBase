console.log('Adjusting exports for CommonJS compatibility...');

const fs = require('node:fs');
const { execSync } = require('node:child_process');

let files = {} // path/to/file: content

function ReadFolder(dir) {
	fs.readdirSync(dir).forEach(file => {
		const filePath = `${dir}/${file}`;
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			ReadFolder(filePath);
		} else {
			files[filePath] = fs.readFileSync(filePath, 'utf8');
		}
	})
}
ReadFolder(`${__dirname}/TS`);

let modified = 0;
for (const file in files) {
	if (!file.endsWith('.ts')) continue;
	const content = files[file];
	if (!content.includes('export default')) continue;
	if (content.includes('export default') && content.includes('module.exports')) continue;
	const newContent = content + '\nmodule.exports = exports.default;';
	fs.writeFileSync(file, newContent);
	modified++;
}

console.log('Checking compilation errors...');
execSync(`tsc -p ${__dirname}/tsconfig.json --noEmit`, { stdio: 'inherit' });

console.log('Compiling to JS...');
execSync(`npx sucrase ${__dirname}/TS --out-dir ${__dirname}/JS --transforms typescript,imports`, { stdio: 'inherit' });

/*
class Client extends _Events2.default {
	#token;
	
	
	
	 __init() {this.connected_at = null} // set in.wsClientClient
	

	 __init2() {this.user = null}

	
	
	
	
	
	
	
	
	

	 __init3() {this.pressence = 'ONLINE'}
	 __init4() {this.activity = null}
	 */

// remove excessive whitespace

console.log('Cleaning up...');

files = {};
ReadFolder(`${__dirname}/JS`);
for (const file in files) {
	const content = files[file];
	const newContent = content.replace(/\n{3,}/g, '\n\n');
	fs.writeFileSync(file, newContent);
}

console.log('Done!');