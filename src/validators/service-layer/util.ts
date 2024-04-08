export const verifyEntityExists = async ({
	repository,
	condition,
	NotFoundError,
}: {
	repository: { findFirst: (condition: any) => Promise<any> };
	condition: any;
	NotFoundError: new () => Error;
}): Promise<void> => {
	const entity = await repository.findFirst(condition);
	if (!entity) {
		throw new NotFoundError();
	}
};

export const verifyEntityDoesNotExist = async ({
	repository,
	condition,
	FoundError,
}: {
	repository: { findFirst: (options: { where: any }) => Promise<any> };
	condition: any;
	FoundError: new () => Error;
}): Promise<void> => {
	const entity = await repository.findFirst({ where: condition });
	if (entity) {
		throw new FoundError();
	}
};
