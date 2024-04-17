import { mockDeep } from "jest-mock-extended";
import type { CreateUserCommand } from "../../src/commands/user/create-user.command";
import type { CreateUserCommandHandler } from "../../src/commands/user/handlers/create-user.command.handler";
import type { DeleteUserCommandHandler } from "../../src/commands/user/handlers/delete-user.command.handler";
import type { UpdateUserCommandHandler } from "../../src/commands/user/handlers/update-user.command.handler";
import { UserController } from "../../src/controllers/user.controller";
import { Logger } from "../../src/logger";
import type { GetAllUsersQueryHandler } from "../../src/queries/user/handlers/get-all-users.query.handler";
import type { GetUserQueryHandler } from "../../src/queries/user/handlers/get-user.query.handler";
import { generateUuid } from "../../src/util";

jest.mock("../../src/config/index.ts", () => ({
	Config: {
		get nodeEnv() {
			return "test";
		},
		get dbPort() {
			return 5432;
		},
		get dbUsername() {
			return "test_user";
		},
		get saltRounds() {
			return 10;
		},
	},
}));

const mockCreateUserCommandHandler = mockDeep<CreateUserCommandHandler>();
const mockDeleteUserCommandHandler = mockDeep<DeleteUserCommandHandler>();
const mockUpdateUserCommandHandler = mockDeep<UpdateUserCommandHandler>();
const mockGetAllUsersQueryHandler = mockDeep<GetAllUsersQueryHandler>();
const mockGetUserQueryHandler = mockDeep<GetUserQueryHandler>();

describe("UserController", () => {
	let userController: UserController;

	beforeEach(() => {
		const loggerMock = Logger.getInstance();
		global.$logger = loggerMock;
		userController = new UserController(
			mockCreateUserCommandHandler,
			mockDeleteUserCommandHandler,
			mockGetAllUsersQueryHandler,
			mockGetUserQueryHandler,
			mockUpdateUserCommandHandler,
		);
	});

	test.each([
		{
			email: "john@example.com",
			name: "John",
			password: "password123",
			username: "johndoe",
		},
		{
			email: "jane@example.com",
			name: "Jane",
			password: "password456",
			username: "janedoe",
		},
		// Bad iput
		{
			email: "john",
			name: "John",
			password: "password123",
			username: "johndoe",
		},
	])(
		"should call createUserCommandHandler.handle with the correct command for $username",
		async ({ email, name, password, username }) => {
			const command: CreateUserCommand = {
				email,
				id: generateUuid(),
				name,
				password,
				username,
			};

			await userController.createUser(command);

			expect(mockCreateUserCommandHandler.handle).toHaveBeenCalledWith(command);
			expect(mockCreateUserCommandHandler.handle).toHaveBeenCalledTimes(1);
		},
	);

	test.each([
		{ id: generateUuid(), expectedCalls: 1 },
		{ id: generateUuid(), expectedCalls: 1 },
	])(
		"should call deleteUserCommandHandler.handle with the correct id for user deletion",
		async ({ id, expectedCalls }) => {
			await userController.deleteUser({ id });

			expect(mockDeleteUserCommandHandler.handle).toHaveBeenCalledWith({ id });
			expect(mockDeleteUserCommandHandler.handle).toHaveBeenCalledTimes(
				expectedCalls,
			);
		},
	);

	test.each([
		{
			email: "john@example.com",
			name: "John",
			password: "password123",
			username: "johndoe",
			id: generateUuid(),
			expectedCalls: 1,
		},
		{
			email: "jane@example.com",
			name: "Jane",
			password: "password456",
			username: "janedoe",
			id: generateUuid(),
			expectedCalls: 1,
		},
	])(
		"should call updateUserCommandHandler.handle with the correct id for user update",
		async ({ email, name, password, username, id, expectedCalls }) => {
			await userController.updateUser({ email, id, name, password, username });

			expect(mockUpdateUserCommandHandler.handle).toHaveBeenCalledWith({
				email,
				id,
				name,
				password,
				username,
			});
			expect(mockUpdateUserCommandHandler.handle).toHaveBeenCalledTimes(
				expectedCalls,
			);
		},
	);

	test("should call getAllUsersQueryHandler.handle", async () => {
		await userController.getAllUsers();

		expect(mockGetAllUsersQueryHandler.handle).toHaveBeenCalled();
		expect(mockGetAllUsersQueryHandler.handle).toHaveBeenCalledTimes(1);
	});

	test("should call getUserQueryHandler.handle", async () => {
		await userController.getUser({ userId: generateUuid() });

		expect(mockGetUserQueryHandler.handle).toHaveBeenCalled();
		expect(mockGetUserQueryHandler.handle).toHaveBeenCalledTimes(1);
	});
});
