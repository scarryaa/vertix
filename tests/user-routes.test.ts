import {
	mockBcrypt,
	mockPrisma,
	mockReply,
	mockRequest,
} from "./__mocks__/mocks";

jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("bcrypt", () => mockBcrypt);

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import {
	createUser,
	getUsers,
	login,
	logout,
} from "../src/modules/user/user.controller";

describe("User Functions", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	const prisma = new PrismaClient();

	test("createUser - successful", async () => {
		const mockBody = {
			password: "password123",
			email: "test@example.com",
			name: "Test User",
			username: "testuser",
		};

		// Mock PrismaClient.create() to return a user object
		(mockRequest as any).body = mockBody;
		(mockReply as any).code.mockClear();
		(mockReply as any).send.mockClear();

		await createUser(mockRequest as any, mockReply);

		// Assert that response code is 201 and user object is sent in response
		expect(mockReply.code).toHaveBeenCalledWith(201);
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				// Assert user object properties
				id: expect.any(String),
				email: mockBody.email,
				name: mockBody.name,
			}),
		);
	});

	test("createUser - user already exists", async () => {
		const mockBody = {
			password: "password123",
			email: "test@example.com",
			name: "Test User",
			username: "testuser",
		};

		// Mock PrismaClient.findFirst() to return an existing user object
		(prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
			id: "existing-user-id",
			email: "test@example.com",
			username: "testuser",
		});

		(mockRequest as any).body = mockBody;

		await createUser(mockRequest as any, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(409);
		expect(mockReply.send).toHaveBeenCalledWith({
			message: "User with this email or username already exists.",
		});
	});

	test("createUser - error", async () => {
		const mockBody = {
			password: "password123",
			email: "test@example.com",
			name: "Test User",
			username: "testuser",
		};

		// Mock PrismaClient.create() to throw an error
		(prisma.user.create as jest.Mock).mockRejectedValueOnce(
			new Error("Mock error"),
		);

		(mockRequest as any).body = mockBody;

		await createUser(mockRequest as any, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(500);
		expect(mockReply.send).toHaveBeenCalledWith({
			message: "Internal Server Error",
		});
	});

	test("login - successful", async () => {
		const mockBody = {
			email: "test@example.com",
			password: "password123",
		};

		// Mock PrismaClient.findUnique() to return a user object
		(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
			id: "mocked-user-id",
			email: "test@example.com",
			name: "Test User",
			password: "hashed-password",
		});

		// Mock bcrypt.compare() to return true
		(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

		(mockRequest as any).body = mockBody;

		await login(mockRequest as any, mockReply);

		expect(mockRequest.jwt.sign).toHaveBeenCalledTimes(1);
		expect(mockReply.setCookie).toHaveBeenCalledWith(
			"access_token",
			expect.any(String),
			{ path: "/", httpOnly: true, secure: true },
		);
		expect(mockReply.send).toHaveBeenCalledWith({
			message: "Login successful.",
		});
	});

	test("login - invalid credentials", async () => {
		const mockBody = {
			email: "test@example.com",
			password: "wrongpassword",
		};

		// Mock PrismaClient.findUnique() to return a user object
		(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
			id: "mocked-user-id",
			email: "test@example.com",
			name: "Test User",
			password: "hashed-password",
		});

		// Mock bcrypt.compare() to return false
		(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

		(mockRequest as any).body = mockBody;

		await login(mockRequest as any, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(401);
		expect(mockReply.send).toHaveBeenCalledWith({
			message: "Invalid email or password.",
		});
	});

	test("logout", async () => {
		await logout(mockRequest as any, mockReply);

		expect(mockReply.clearCookie).toHaveBeenCalledWith("access_token");
		expect(mockReply.send).toHaveBeenCalledWith({
			message: "Logout successful.",
		});
	});
});
