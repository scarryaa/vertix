import { Validator } from "../../src/validators/service-layer/base.validator";

describe("ValidateDecorator", () => {
	it("should pass validation for valid data", async () => {
		const mockTarget = { testMethod: jest.fn() };
		const mockValidationFunction = jest.fn().mockReturnValue({ isValid: true });
		const decorated = new Validator();
		const someValidData = { some: "valid data" };

		await decorated.validate(someValidData);

		expect(mockValidationFunction).toHaveBeenCalledWith(someValidData);
		expect(mockTarget.testMethod).toHaveBeenCalledWith(someValidData);
	});

	it("should throw an error for invalid data", async () => {
		const mockTarget = { testMethod: jest.fn() };
		const mockValidationFunction = jest
			.fn()
			.mockReturnValue({ isValid: false, errors: ["some error"] });
		const decorated = new Validator();
		const someInvalidData = { some: "invalid data" };

		await decorated.validate(someInvalidData);
	});
});
