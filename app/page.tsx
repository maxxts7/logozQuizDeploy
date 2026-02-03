import Link from "next/link"
import { Button } from "@/components/ui"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">QuizDesk</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Fast, simple, and powerful
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
              Create, Share, and Analyze
              <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Quizzes with Ease
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Build engaging quizzes, share them instantly with anyone, and get detailed analytics on performance and rankings. No sign-up required for participants.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto min-w-[160px]">
                  Start Creating
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[160px]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-slate-200 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Create Quizzes
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Build multiple-choice quizzes with custom time limits, point values, and randomization options. Import questions from Excel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-slate-200 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Easy Sharing
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Share quiz links instantly with anyone. Participants can take quizzes without creating an account or signing up.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-slate-200 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Track Analytics
              </h3>
              <p className="text-slate-600 leading-relaxed">
                View detailed leaderboards, scores, completion times, and rankings. Export results to Excel for further analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="bg-white border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Everything you need for quizzes
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                Powerful features to create, manage, and analyze your quizzes
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Time Limits", desc: "Set countdown timers" },
                { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", title: "Randomization", desc: "Shuffle questions & options" },
                { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Excel Import", desc: "Import from spreadsheets" },
                { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "IP Limits", desc: "Control attempt limits" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to create your first quiz?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-8">
              Join thousands of educators, trainers, and teams using QuizDesk to engage their audience.
            </p>
            <Link href="/register">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 border-0"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-900">QuizDesk</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} QuizDesk. Built with Next.js.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
