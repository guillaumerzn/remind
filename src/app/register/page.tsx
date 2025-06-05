'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implémenter la logique d'inscription
    console.log('Register attempt:', formData)
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
        <div className="mt-2 text-lg text-[#2E8B8B] font-medium tracking-wide">Création de compte</div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto px-4">
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-[#E0EAEA]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-base font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#2E8B8B] focus:ring-[#2E8B8B] text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-base font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#2E8B8B] focus:ring-[#2E8B8B] text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#2E8B8B] focus:ring-[#2E8B8B] text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white font-bold shadow hover:from-gray-500 hover:to-gray-700 transition-colors text-base border border-gray-300 cursor-pointer"
              >
                Créer un compte
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/login" className="font-medium text-[#2E8B8B] hover:text-[#00A8A8]">
                Se connecter
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 