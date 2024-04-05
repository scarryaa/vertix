import type { CreateRepository, RepositoryDetailed } from "../../src/models";
import { UnauthorizedError } from "../../src/utils/errors";
import {
	MockCollaboratorRepositoryImpl,
	type MockContext,
	MockRepositoryRepositoryImpl,
	MockRepositoryService,
	createMockContext,
} from "../__mocks__/mocks";

describe("RepositoryService", () => {
	let mockContext: MockContext;
	let mockCollaboratorRepo: MockCollaboratorRepositoryImpl;
	let mockRepositoryRepo: MockRepositoryRepositoryImpl;
	let mockRepositoryService: MockRepositoryService;

	beforeEach(() => {
		mockContext = createMockContext();
		mockCollaboratorRepo = new MockCollaboratorRepositoryImpl(mockContext);
		mockRepositoryRepo = new MockRepositoryRepositoryImpl(mockContext);
		mockRepositoryService = new MockRepositoryService(
			mockRepositoryRepo,
			mockCollaboratorRepo,
		);
	});

	describe("findById", () => {
		it("should return a repository by id", async () => {
			const repository: RepositoryDetailed = {
				id: 1,
				name: "test-repo",
				owner_id: 1,
				description: null,
				visibility: "public",
				created_at: new Date(),
				language: null,
				license_id: null,
				organization_id: null,
				tag_id: null,
				updated_at: new Date(),
			};
			mockRepositoryRepo.findById.mockResolvedValueOnce(repository);

			const result = await mockRepositoryService.findById(1);

			expect(result).toEqual(repository);
			expect(mockRepositoryRepo.findById).toHaveBeenCalledWith(1);
		});
	});

	describe("create", () => {
		it("should create a new repository", async () => {
			const createdRepository: CreateRepository = {
				name: "test-repo",
				description: "Test repository",
				visibility: "public",
				owner_id: 1,
			};
			mockRepositoryRepo.create.mockResolvedValueOnce(createdRepository);

			const result = await mockRepositoryRepo.create(1, {
				name: "test-repo",
				description: "Test repository",
				visibility: "public",
			});

			expect(result).toEqual(createdRepository);
			expect(mockRepositoryRepo.create).toHaveBeenCalledWith(1, {
				name: "test-repo",
				description: "Test repository",
				visibility: "public",
			});
		});
	});

	describe("update", () => {
		it("should update a repository if user is authorized", async () => {
			const updatedRepository: Repository = {
				id: 1,
				name: "updated-repo",
				description: "Updated repository",
				visibility: "private",
				owner_id: 1,
				created_at: new Date(),
				language: null,
				license_id: null,
				organization_id: null,
				tag_id: null,
				updated_at: new Date(),
			};
			mockRepositoryRepo.update.mockResolvedValueOnce(updatedRepository);
			mockRepositoryService.isUserCollaborator = jest
				.fn()
				.mockResolvedValueOnce(true);

			const result = await mockRepositoryRepo.update(1, 1, {
				name: "updated-repo",
				description: "Updated repository",
				visibility: "private",
			});

			expect(result).toEqual(updatedRepository);
			expect(mockRepositoryRepo.update).toHaveBeenCalledWith(1, 1, {
				name: "updated-repo",
				description: "Updated repository",
				visibility: "private",
			});
			expect(mockRepositoryService.isUserCollaborator).toHaveBeenCalledWith(
				1,
				1,
			);
		});

		it("should throw UnauthorizedError if user is not authorized", async () => {
			mockRepositoryService.isUserCollaborator = jest
				.fn()
				.mockResolvedValueOnce(false);

			await expect(
				mockRepositoryService.update(1, 1, {
					name: "updated-repo",
					description: "Updated repository",
					visibility: "private",
				}),
			).rejects.toThrowError(UnauthorizedError);
			expect(mockRepositoryService.isUserCollaborator).toHaveBeenCalledWith(
				1,
				1,
			);
		});
	});
});
