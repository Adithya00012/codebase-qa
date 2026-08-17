import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./prismaClient";

const JWT_SECRET: string = process.env.JWT_SECRET!;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(email: string, password: string) {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { token };
}

export async function login(email: string, password: string) {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { token };
}
