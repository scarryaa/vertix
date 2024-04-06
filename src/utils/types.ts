import { ProgrammingLanguage, type UserRole } from "../models";

export type KeysOfType<T> = keyof {
	[K in keyof T as T[K] extends never ? never : K]: K;
};

export const convertProgrammingLanguageToDisplayName: Record<
	ProgrammingLanguage,
	string
> = {
	[ProgrammingLanguage.JAVASCRIPT]: "JavaScript",
	[ProgrammingLanguage.TYPESCRIPT]: "TypeScript",
	[ProgrammingLanguage.PYTHON]: "Python",
	[ProgrammingLanguage.RUBY]: "Ruby",
	[ProgrammingLanguage.JAVA]: "Java",
	[ProgrammingLanguage.GO]: "Go",
	[ProgrammingLanguage.C]: "C",
	[ProgrammingLanguage.CPP]: "C++",
	[ProgrammingLanguage.CSHARP]: "C#",
	[ProgrammingLanguage.SWIFT]: "Swift",
	[ProgrammingLanguage.RUST]: "Rust",
	[ProgrammingLanguage.KOTLIN]: "Kotlin",
	[ProgrammingLanguage.PHP]: "PHP",
	[ProgrammingLanguage.SCALA]: "Scala",
	[ProgrammingLanguage.CLOJURE]: "Clojure",
	[ProgrammingLanguage.HASKELL]: "Haskell",
	[ProgrammingLanguage.ERLANG]: "Erlang",
	[ProgrammingLanguage.ELIXIR]: "Elixir",
	[ProgrammingLanguage.PERL]: "Perl",
	[ProgrammingLanguage.GROOVY]: "Groovy",
	[ProgrammingLanguage.BASH]: "Bash",
	[ProgrammingLanguage.R]: "R",
	[ProgrammingLanguage.MATLAB]: "MATLAB",
	[ProgrammingLanguage.OBJECTIVE_C]: "Objective-C",
	[ProgrammingLanguage.ASSEMBLY]: "Assembly",
	[ProgrammingLanguage.LISP]: "Lisp",
};

export interface JwtPayload {
	userId: number;
	role: UserRole;
}
