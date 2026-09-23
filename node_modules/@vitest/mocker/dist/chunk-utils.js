const postfixRE = /[?#].*$/;
function cleanUrl(url) {
	return url.replace(postfixRE, "");
}
function createManualModuleSource(moduleUrl, exports, globalAccessor = "\"__vitest_mocker__\"") {
	const source = `
const __factoryModule__ = await globalThis[${globalAccessor}].getFactoryModule("${moduleUrl}");
`;
	const keys = exports.map((name, index) => {
		return `let __${index} = __factoryModule__["${name}"]
export { __${index} as "${name}" }`;
	}).join("\n");
	let code = `${source}\n${keys}`;
	// this prevents recursion
	code += `
if (__factoryModule__.__factoryPromise != null) {
  __factoryModule__.__factoryPromise.then((resolvedModule) => {
    ${exports.map((name, index) => {
		return `__${index} = resolvedModule["${name}"];`;
	}).join("\n")}
  })
}
  `;
	return code;
}

export { cleanUrl as a, createManualModuleSource as c };
