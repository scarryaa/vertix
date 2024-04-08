import { any, mock } from "jest-mock-extended";
import type { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import {
	type RepositoryBasic,
	type Star,
	type UserBasic,
	UserRole,
} from "../../src/models";
import type { StarRepository } from "../../src/repositories/star.repository";
import type { RepositoryRepositoryService } from "../../src/services/repository.service";
import { StarService } from "../../src/services/star.service";
import type { UserService } from "../../src/services/user.service";
import {
	RepositoryNotFoundError,
	UnauthorizedError,
} from "../../src/utils/errors";
import {
	StarAlreadyExistsError,
	StarNotFoundError,
} from "../../src/utils/errors/star.error";
import { UserNotFoundError } from "../../src/utils/errors/user.error";
import { ServiceLocator } from "../../src/utils/service-locator";
import type { Validator } from "../../src/validators/service-layer/base.validator";
import {
	generateRepository,
	generateStar,
	generateUser,
} from "../__mocks__/mocks";

describe("StarService", () => {
	let starService: StarService;
	let repositoryService: jest.Mocked<RepositoryRepositoryService>;
	let userService: jest.Mocked<UserService>;
	let authenticator: jest.Mocked<Authenticator>;
	let validator: jest.Mocked<Validator<Star>>;
	let starRepository: jest.Mocked<StarRepository>;
	let user: UserBasic;
	let star: Star;
	let repository: RepositoryBasic;
	const successfulAuthResult = { user_id: 1, role: UserRole.USER };
	const unsuccessfulAuthResult = { user_id: 2, role: UserRole.USER };
	const successfulValidationResult = {
		isValid: true,
		errorMessage: undefined,
	};
	const auth_token = "auth_token";

	beforeEach(() => {
		starRepository = mock<StarRepository>();
		repositoryService = mock<RepositoryRepositoryService>();
		userService = mock<UserService>();
		authenticator = mock<Authenticator>();
		validator = mock<Validator<Star>>();

		starService = new StarService({
			authenticator,
			validator,
			repositoryService,
			userService,
			starRepository,
		});

		// Set up models
		user = generateUser();
		star = generateStar();
		repository = generateRepository();

		// Happy path
		authenticator.authenticate.mockResolvedValue(successfulAuthResult as never);
		validator.validateAllFields.mockResolvedValue(
			successfulValidationResult as never,
		);
		validator.validate.mockResolvedValue(successfulValidationResult as never);
		validator.validateAllFields.mockResolvedValue(
			successfulValidationResult as never,
		);
		userService.checkUserExists.mockResolvedValue(true);
		repositoryService.checkRepositoryExistsById.mockResolvedValue(true);
		starRepository.findFirst.mockResolvedValue(null);
		starRepository.create.mockResolvedValue(star);

		// Register services
		ServiceLocator.registerValidator("StarValidator", validator);
	});

	describe("create", () => {
		beforeEach(() => {
			userService.checkUserExists.mockResolvedValue(true);
			repositoryService.checkRepositoryExistsById.mockResolvedValue(true);
			starRepository.create.mockResolvedValue(star);
		});

		it("should successfully create a star when all fields are valid and user exists", async () => {
			let result: Star | undefined;

			try {
				result = await starService.createStar(star, auth_token);
			} catch (error) {
				expect(error).toBeUndefined();
			}

			expect(result).toEqual(star);
			expect(starRepository.create).toHaveBeenCalledWith({
				repository_id: 1,
				user_id: 1,
				created_at: expect.any(Date),
				updated_at: expect.any(Date),
				id: 1,
			});
		});

		it("should throw UserNotFoundError if the user does not exist", async () => {
			userService.checkUserExists.mockResolvedValue(false);

			try {
				await starService.createStar(
					{
						repository_id: star.repository_id,
					},
					auth_token,
				);
			} catch (error) {
				expect(error).toBeInstanceOf(UserNotFoundError);
			}

			expect(starRepository.create).not.toHaveBeenCalled();
			expect(userService.checkUserExists).toHaveBeenCalledWith(1);
		});

		it("should throw RepositoryNotFoundError if the repository does not exist", async () => {
			repositoryService.checkRepositoryExistsById.mockResolvedValue(false);
			let result: Star | null | undefined;

			try {
				result = await starService.createStar(
					{
						repository_id: star.repository_id,
					},
					auth_token,
				);
			} catch (error) {
				expect(error).toBeInstanceOf(RepositoryNotFoundError);
			}

			expect(starRepository.create).not.toHaveBeenCalled();
			expect(repositoryService.checkRepositoryExistsById).toHaveBeenCalledWith(
				1,
			);
			expect(userService.checkUserExists).toHaveBeenCalledWith(1);
			expect(result).toBeUndefined();
		});

		it("should throw StarAlreadyExistsError if the star already exists", async () => {
			starRepository.findFirst.mockResolvedValue(star);

			try {
				await starService.createStar(
					{
						repository_id: 1,
					},
					"auth-token",
				);
			} catch (error) {
				expect(error).toBeInstanceOf(StarAlreadyExistsError);
			}
			expect(repositoryService.checkRepositoryExistsById).toHaveBeenCalledWith(
				1,
			);
			expect(userService.checkUserExists).toHaveBeenCalledWith(1);
			expect(starRepository.findFirst).toHaveBeenCalledWith({
				where: {
					repository_id: 1,
					user_id: 1,
				},
			});
			expect(starRepository.findFirst).toHaveBeenCalledTimes(1);
		});
	});

	describe("getStarById", () => {
		it("should return a star", async () => {
			starRepository.findFirst.mockResolvedValue(star);

			const result = await starService.getStarById(1);

			expect(result).toEqual({
				id: 1,
				created_at: any(Date),
				updated_at: any(Date),
				repository_id: 1,
				user_id: 1,
			});
			expect(starRepository.findFirst).toHaveBeenCalledWith({
				where: {
					id: 1,
				},
			});
			expect(starRepository.findFirst).toHaveBeenCalledTimes(1);
		});

		it("should throw if the star does not exist", async () => {
			let result: Star | null | undefined;

			try {
				result = await starService.getStarById(1);
			} catch (error) {
				expect(error).toBeInstanceOf(StarNotFoundError);
			}

			expect(starRepository.findFirst).toHaveBeenCalledWith({
				where: {
					id: 1,
				},
			});
			expect(starRepository.findFirst).toHaveBeenCalledTimes(1);
		});
	});

	describe("deleteStar", () => {
		beforeEach(() => {
			starRepository.delete.mockResolvedValue(undefined);
			userService.checkUserExists.mockResolvedValue(true);
			repositoryService.checkRepositoryExistsById.mockResolvedValue(true);
			starRepository.findFirst.mockResolvedValue(star);
		});

		it("should delete a star", async () => {
			const result = await starService.deleteStar(1, auth_token);
			expect(result).toEqual(undefined);
			expect(starRepository.delete).toHaveBeenCalledWith(1);
			expect(starRepository.delete).toHaveBeenCalledTimes(1);
		});

		it("should throw StarNotFoundError if the star does not exist", async () => {
			try {
				await starService.deleteStar(1, auth_token);
			} catch (error) {
				expect(error).toBeInstanceOf(StarNotFoundError);
			}

			expect(starRepository.findFirst).toHaveBeenCalledWith({
				where: {
					id: 1,
				},
			});
		});

		it("should throw UnauthorizedError if the user is not the owner of the star", async () => {
			authenticator.authenticate.mockResolvedValue({
				user_id: 2,
				role: UserRole.USER,
			} as never);

			try {
				await starService.deleteStar(1, auth_token);
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
			}

			expect(repositoryService.checkRepositoryExistsById).toHaveBeenCalledWith(
				1,
			);
		});

		it("should throw RepositoryNotFoundError if the repository does not exist", async () => {
			repositoryService.checkRepositoryExistsById.mockResolvedValue(false);
			starRepository.findFirst.mockResolvedValue(star);

			try {
				await starService.deleteStar(1, auth_token);
			} catch (error) {
				expect(error).toBeInstanceOf(RepositoryNotFoundError);
			}
			expect(starRepository.findFirst).toHaveBeenCalledWith({
				where: {
					id: 1,
				},
			});
		});
	});
});
