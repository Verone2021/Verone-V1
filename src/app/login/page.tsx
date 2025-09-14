"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Authentification avec Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou mot de passe incorrect')
        return
      }

      if (data.user) {
        // Succès - redirection vers dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Vérone */}
        <div className="text-center mb-8">
          <div className="font-logo text-4xl font-light tracking-wider text-black mb-2">
            VÉRONE
          </div>
          <p className="text-black opacity-70 text-sm">
            Back Office - Connexion
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="border border-black bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black bg-white py-3 px-4 text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                placeholder="veronebyromeo@gmail.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black bg-white py-3 px-4 pr-12 text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black opacity-50 hover:opacity-70"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="text-red-600 text-sm text-center border border-red-600 bg-red-50 p-3">
                {error}
              </div>
            )}

            {/* Bouton de connexion */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-white hover:text-black border border-black transition-colors duration-200 py-3 h-auto"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Connexion...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Se connecter</span>
                </div>
              )}
            </Button>
          </form>

          {/* Informations de test */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
            <p className="text-xs text-black opacity-70 mb-2 font-medium">
              Compte de test MVP :
            </p>
            <div className="text-xs text-black opacity-60 space-y-1">
              <div>Email : <code className="bg-white px-1">veronebyromeo@gmail.com</code></div>
              <div>Mot de passe : <code className="bg-white px-1">Abc123456</code></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-black opacity-50">
            Vérone Back Office - Version MVP
          </p>
        </div>
      </div>
    </div>
  )
}