import type { Collaborator } from "@prisma/client";
import prisma from "../utils/prisma";

export class CollaboratorRepository {
  async findById(id: number): Promise<Collaborator | null> {
    const collaborator = await prisma.collaborator.findUnique({
      where: {
        id,
      },
    });

    return collaborator;
  }

  async findOne(
    repositoryId: number,
    userId: number
  ): Promise<Collaborator | null> {
    const collaborator = await prisma.collaborator.findUnique({
      where: {
        repositoryId_userId: {
          repositoryId,
          userId,
        },
      },
    });

    return collaborator;
  }
}