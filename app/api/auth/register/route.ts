import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").optional(),
})

export async function POST(req: NextRequest) {
  console.log("[Register] Starting registration request")

  try {
    const body = await req.json()
    console.log("[Register] Request body received:", { email: body?.email, hasPassword: !!body?.password, name: body?.name })

    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      console.log("[Register] Validation failed:", validated.error.issues)
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { email, password, name } = validated.data
    console.log("[Register] Validation passed for:", email)

    // Check if user already exists
    console.log("[Register] Checking if user exists...")
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    console.log("[Register] User exists check complete:", !!existingUser)

    if (existingUser) {
      console.log("[Register] User already exists:", email)
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    console.log("[Register] Hashing password...")
    const passwordHash = await bcrypt.hash(password, 10)
    console.log("[Register] Password hashed successfully")

    // Create user
    console.log("[Register] Creating user in database...")
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })
    console.log("[Register] User created successfully:", user.id)

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Register] Error occurred:", error)
    console.error("[Register] Error name:", (error as Error)?.name)
    console.error("[Register] Error message:", (error as Error)?.message)
    console.error("[Register] Error stack:", (error as Error)?.stack)

    return NextResponse.json(
      { error: "Failed to create user", details: (error as Error)?.message },
      { status: 500 }
    )
  }
}
