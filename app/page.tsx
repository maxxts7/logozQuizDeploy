import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">LogosQuiz</h1>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-blue-600"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create, Share, and Analyze Quizzes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Build engaging quizzes, share them with your audience, and get detailed analytics on performance and rankings.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Create Quizzes</h3>
            <p className="text-gray-600">
              Build multiple-choice quizzes with custom time limits and share them instantly.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
            <p className="text-gray-600">
              Share quiz links with anyone. No sign-up required for quiz takers.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Track Analytics</h3>
            <p className="text-gray-600">
              View detailed leaderboards, scores, completion times, and rankings.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-8 text-center text-gray-600">
        <p>&copy; 2026 LogosQuiz. Built with Next.js and PostgreSQL.</p>
      </footer>
    </div>
  )
}
