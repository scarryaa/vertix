import type express from "express";

export function asyncHandler(
	fn: (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => Promise<any>,
) {
	return async (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		await Promise.resolve(fn(req, res, next)).catch(next);
	};
}
