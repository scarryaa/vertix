import type { IAggregateRoot } from "./BaseAggregateRoot";

// biome-ignore lint/complexity/noStaticOnlyClass: This class is static only
export class AggregateRootFactory {
	private static registry = new Map<string, { new (): IAggregateRoot }>();

	public static registerAggregateRoot(
		key: string,
		aggregateType: { new (): IAggregateRoot },
	): void {
		AggregateRootFactory.registry.set(key, aggregateType);
	}

	public static createAggregateRoot(key: string): IAggregateRoot | null {
		const aggregateType = AggregateRootFactory.registry.get(key);
		if (aggregateType) {
			return new aggregateType();
		}
		return null;
	}
}
