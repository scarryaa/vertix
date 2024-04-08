import { any, mock } from "jest-mock-extended";
import { string } from "zod";
import type { Authenticator } from "../../src/authenticators/service-layer/base.authenticator";
import { type UserDetailed, UserRole } from "../../src/models";
import type { UserBasicRepository } from "../../src/repositories/user-basic.repository";
import type { UserDetailedRepository } from "../../src/repositories/user-detailed.repository";
import { type User, UserService } from "../../src/services/user.service";
import { UnauthorizedError } from "../../src/utils/errors";
import {
	UserAlreadyExistsError,
	UserNotFoundError,
} from "../../src/utils/errors/user.error";
import { ServiceLocator } from "../../src/utils/service-locator";
import type { Validator } from "../../src/validators/service-layer/base.validator";
import {
	MockValidator,
	generateUser,
	generateUserDetailed,
} from "../__mocks__/mocks";

describe("UserService", () => {
	let service: UserService;
	let userBasicRepository: jest.Mocked<UserBasicRepository>;
	let userDetailedRepository: jest.Mocked<UserDetailedRepository>;
	const authenticator: jest.Mocked<Authenticator> = mock<Authenticator>();
	let validator: Validator<unknown>;
	let user: User;
	let userDetailed: UserDetailed;

	beforeEach(() => {
		userBasicRepository = mock<UserBasicRepository>();
		userDetailedRepository = mock<UserDetailedRepository>();
		validator = new MockValidator();

		service = new UserService({
			config: {
				repository: userBasicRepository,
			},
			userBasicRepository: userBasicRepository,
			userDetailedRepository: userDetailedRepository,
			authenticator: authenticator,
			validator: validator,
		});

		// Register with ServiceLocator
		ServiceLocator.registerValidator("UserValidator", validator);
		ServiceLocator.registerAuthenticator("UserAuthenticator", authenticator);

		user = generateUser();
		userDetailed = generateUserDetailed();
	});

	describe("create", () => {
		it("should create a new user and omit the password in the response", async () => {
			userBasicRepository.create.mockResolvedValue(user);
			const result = await service.create(user, "auth-token");

			expect(result).toEqual({ ...user, password: any(string) });
			expect(userBasicRepository.create).toHaveBeenCalledWith({
				...user,
				password: any(string),
			});
		});

		it("should throw UserAlreadyExists error if user already exists", async () => {
			userBasicRepository.findOne.mockResolvedValue(user);
			await expect(service.create(user, "auth-token")).rejects.toThrow(
				UserAlreadyExistsError,
			);
		});
	});

	describe("update", () => {
		it("should update a user and omit the password in the returned object", async () => {
			userDetailedRepository.update.mockResolvedValue({
				...user,
				password: "hashed-password",
			});

			const result = await service.update(
				user.id,
				user,
				undefined,
				"auth-token",
			);

			expect(result).toEqual({ ...user, password: undefined });

			expect(userDetailedRepository.update).toHaveBeenCalledWith(1, {
				...user,
				password: undefined,
			});
		});

		it("should update a user and return the updated user", async () => {
			userDetailedRepository.update.mockResolvedValue(user);

			const result = await service.update(
				user.id,
				user,
				undefined,
				"auth-token",
			);

			expect(result).toEqual(user);

			expect(userDetailedRepository.update).toHaveBeenCalledWith(1, {
				...user,
				password: undefined,
			});
		});

		it("should throw UserNotFoundError if user does not exist", async () => {
			userDetailedRepository.getById.mockResolvedValue(null);

			await expect(
				service.update(user.id, user, undefined, "auth-token"),
			).rejects.toThrow(UserNotFoundError);
		});

		it("should throw UnauthorizedError if user is not authorized", async () => {
			userDetailedRepository.getById.mockResolvedValue(userDetailed);

			await expect(
				service.update(
					user.id,
					{ ...user, id: 900 },
					undefined,
					"invalid-auth-token",
				),
			).rejects.toThrow(UnauthorizedError);
		});
	});

	describe("delete", () => {
		it("should delete a user", async () => {
			userBasicRepository.delete.mockResolvedValue();
			authenticator.authenticate.mockReturnValue({
				user_id: 1,
				role: UserRole.USER,
			});

			const result = await service.delete(user.id, 1, "auth-token");

			expect(result).toEqual(undefined);
			expect(userBasicRepository.delete).toHaveBeenCalledWith(1);
		});

		it("should throw UserNotFoundError if user does not exist", async () => {
			userDetailedRepository.getById.mockResolvedValue(null);

			await expect(service.delete(8, 8, "auth-token")).rejects.toThrow(
				UserNotFoundError,
			);
			expect(userDetailedRepository.getById).toHaveBeenCalledWith(8);
		});

		it("should throw UnauthorizedError if user is not authorized", async () => {
			userBasicRepository.getById.mockResolvedValue(user);
			authenticator.authenticate.mockResolvedValue({
				user_id: 8,
				role: UserRole.ADMIN,
			} as never);

			await expect(service.delete(1, 0, "invalid-auth-token")).rejects.toThrow(
				UnauthorizedError,
			);
		});
	});

	describe("checkUserExists", () => {
		it("should return true if user exists", async () => {
			userBasicRepository.getById.mockResolvedValue(user);

			const result = await service.checkUserExists(1);

			expect(result).toEqual(true);
			expect(userBasicRepository.getById).toHaveBeenCalledWith(1);
		});

		it("should return false if user does not exist", async () => {
			userBasicRepository.getById.mockResolvedValue(null);

			const result = await service.checkUserExists(1);

			expect(result).toEqual(false);
			expect(userBasicRepository.getById).toHaveBeenCalledWith(1);
		});
	});
});
