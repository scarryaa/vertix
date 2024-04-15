import type express from "express";

export function asyncHandler(
	fn: (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => Promise<any> | void,
) {
	return async (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		try {
            await Promise.resolve(fn(req, res, next)).catch(next);
        } catch (err) {
            next(err);
        }
	};
}
