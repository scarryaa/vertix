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
};
