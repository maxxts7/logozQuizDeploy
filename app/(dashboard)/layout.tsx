import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Navigation */}
      <nav className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-900">QuizDesk</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  My Quizzes
                </Link>
                <Link
                  href="/dashboard/quiz/create"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Create Quiz
                </Link>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                  <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-sm text-slate-700 max-w-[150px] truncate">
                    {session.user.email}
                  </span>
                </div>
              </div>

              <form
                action={async () => {
                  "use server"
                  const { signOut } = await import("@/lib/auth")
                  await signOut({ redirectTo: "/" })
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t border-slate-100 px-4 py-2 flex gap-1">
          <Link
            href="/dashboard"
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            My Quizzes
          </Link>
          <Link
            href="/dashboard/quiz/create"
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Create Quiz
          </Link>
        </div>
      </nav>

      {/* Main Content - scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
