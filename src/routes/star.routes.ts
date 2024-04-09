import type { AuthenticateInstance } from "../../types/request";
import { Container } from "../container";
import {
	createStar,
	deleteStar,
	getStarById,
} from "../controllers/star.controller";
import { validateToken } from "../middlewares/validate-token.middleware";
import {
	$ref,
	type DeleteStarParams,
	type StarInput,
	type StarResponse,
} from "../schemas/star.schema";

const container = Container.getInstance();
const starService = container.getStarService();

export const starRoutes = async function starRoutes(app: AuthenticateInstance) {
	app.post<{
		Body: StarInput;
		Response: {
			201: StarResponse;
		};
	}>(
		"/create",
		{
			preHandler: validateToken,
			schema: {
				body: $ref("createStar"),
				response: {
					201: $ref("createStarResponse"),
				},
			},
		},
		createStar(starService),
	);

	app.get(
		"/:id",
		{
			schema: {
				params: $ref("getStar"),
				response: {
					201: $ref("getStarResponse"),
				},
			},
		},
		getStarById(starService),
	);

	app.delete<{
		Params: DeleteStarParams;
		Response: {
			204: undefined;
		};
	}>(
		"/delete/:id",
		{
			preHandler: validateToken,
			schema: {
				params: $ref("deleteStarParams"),
				response: {
					204: {
						type: "null",
					},
				},
			},
		},
		deleteStar(starService),
	);
};
