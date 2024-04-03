-- CreateTable
CREATE TABLE "actor" (
    "did" VARCHAR NOT NULL,
    "handle" VARCHAR NOT NULL,

    CONSTRAINT "PK_6aa7f0422c0b50e5fe55d7e7d11" PRIMARY KEY ("did")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR NOT NULL,
    "lastName" VARCHAR NOT NULL,
    "age" INTEGER NOT NULL,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);
