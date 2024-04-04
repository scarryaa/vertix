import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const main = async () => {
    const alice = await prisma.user.upsert({
        where: { email: "alice@test.test" },
        update: {},
        create: {
            email: "alice@test.test",
            name: "Alice",
            password: "password",
            username: "alice123",
            repositories: {
                create: {
                    name: "typescript",
                    visibility: "public",
                    description: "typescript stuff",
                }
            }
        }
    });

    const bob = await prisma.user.upsert({
        where: { email: "bob@test.test" },
        update: {},
        create: {
            email: "bob@test.test",
            name: "Bob",
            password: "hunter2",
            username: "bobbyboy24",
            repositories: {
                createMany: {
                    data: [
                        {
                            name: "my-awesome-repo",
                            description: "cool stuff!!",
                            visibility: "public"
                        },
                        {
                            name: "go-lang",
                            visibility: "private"
                        }
                    ]
                }
            }
        }
    });

    const mary = await prisma.user.upsert({
        where: {email: "mary@test.test"},
        update: {},
        create: {
            email: "mary@test.test",
            name: "Mary",
            password: "password",
            username: "maary",
            bio: "Hi! This is my profile.",
        }
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });