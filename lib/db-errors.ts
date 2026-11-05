import { Prisma } from "@/generated/prisma/client";

// A unique constraint refused the write, e.g. a second booking of the same slot or a repeated email.
export const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
