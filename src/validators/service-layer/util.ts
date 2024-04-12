export const verifyEntityExists = async ({
	repository,
	condition,
	notFoundError,
}: {
	repository: { findFirst: (condition: any) => Promise<any> };
	condition: any;
	notFoundError: new () => Error;
}): Promise<void> => {
	const entity = await repository.findFirst(condition);
	if (!entity) {
		throw new notFoundError();
	}
};

export const verifyEntityDoesNotExist = async ({
	repository,
	condition,
	foundError,
}: {
	repository: { findFirst: (options: { where: any }) => Promise<any> };
	condition: any;
	foundError: new () => Error;
}): Promise<void> => {
	const entity = await repository.findFirst({ where: condition });
	if (entity) {
		throw new foundError();
	}
};
