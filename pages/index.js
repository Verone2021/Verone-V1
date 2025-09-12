export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          🚀 Next.js MCP Template
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Template with full MCP stack integration for Claude Code
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Next.js:</span>
            <span className="font-semibold text-green-600">✅</span>
          </div>
          <div className="flex justify-between">
            <span>Tailwind CSS:</span>
            <span className="font-semibold text-green-600">✅</span>
          </div>
          <div className="flex justify-between">
            <span>Supabase:</span>
            <span className="font-semibold text-green-600">✅</span>
          </div>
          <div className="flex justify-between">
            <span>shadcn/ui:</span>
            <span className="font-semibold text-green-600">✅</span>
          </div>
        </div>
      </div>
    </div>
  )
}