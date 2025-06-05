'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implémenter la logique de connexion
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="min-h-screen font-sans bg-gray-100">
      {/* Header */}
      <header className="w-full py-8 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2E8B8B] text-white shadow-lg">
            <Brain size={32} />
          </span>
          <span className="font-extrabold text-3xl text-gray-900 tracking-tight ml-2" style={{letterSpacing: '.01em'}}>Remind</span>
        </div>
        <div className="mt-2 text-lg text-[#2E8B8B] font-medium tracking-wide">Connexion</div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto px-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-[#E0EAEA]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#2E8B8B] focus:ring-[#2E8B8B] text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#2E8B8B] focus:ring-[#2E8B8B] text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#2E8B8B] focus:ring-[#2E8B8B] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[#2E8B8B] hover:text-[#00A8A8]">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white font-bold shadow hover:from-gray-500 hover:to-gray-700 transition-colors text-base border border-gray-300 cursor-pointer"
              >
                Se connecter
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/register" className="font-medium text-[#2E8B8B] hover:text-[#00A8A8]">
                Créer un compte
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 