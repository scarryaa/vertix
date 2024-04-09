module.exports = {
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: "./tsconfig.json",
			},
		],
	},
	transformIgnorePatterns: [`node_modules/(?!${["node-fetch"].join("|")})`],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!**/node_modules/**",
		"!**/__tests__/**",
		"!**/__mocks__/**",
	],
};
