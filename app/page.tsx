export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SphereCX</h1>
        <p className="text-gray-400 mb-8">Quality Assurance Platform for Call Centers</p>
        <a
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  )
}
