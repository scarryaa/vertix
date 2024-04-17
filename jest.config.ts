module.exports = {
	roots: ["<rootDir>"],
	transform: {
		"^.+\\.ts?$": "ts-jest",
	},
	preset: "ts-jest",
	testEnvironment: "node",
	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
	moduleFileExtensions: ["ts", "js", "json", "node"],
	collectCoverage: true,
	clearMocks: true,
	coverageDirectory: "coverage",
};
