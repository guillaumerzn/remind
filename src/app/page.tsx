import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function Home() {
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
        <div className="mt-2 text-lg text-[#2E8B8B] font-medium tracking-wide">Gestion de rendez-vous médicaux</div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto pb-10 px-4 md:px-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-10 mb-10 border border-[#E0EAEA]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Simplifiez la gestion de vos rendez-vous médicaux
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Ne manquez plus jamais vos rendez-vous médicaux. Remind vous aide à gérer vos consultations et vous envoie des rappels personnalisés.
            </p>
            <div className="space-x-4">
              <Link 
                href="/login" 
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white font-bold shadow hover:from-gray-500 hover:to-gray-700 transition-colors text-base border border-gray-300 cursor-pointer"
              >
                Se connecter
              </Link>
              <Link 
                href="/register" 
                className="px-5 py-2 rounded-lg bg-white text-[#2E8B8B] font-bold shadow hover:bg-gray-50 transition-colors text-base border border-[#2E8B8B] cursor-pointer"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 border border-[#E0EAEA]">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Rappels automatiques</h3>
            <p className="text-gray-600">Recevez des notifications pour ne jamais oublier vos rendez-vous médicaux.</p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 border border-[#E0EAEA]">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Gestion simplifiée</h3>
            <p className="text-gray-600">Organisez facilement tous vos rendez-vous médicaux au même endroit.</p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 border border-[#E0EAEA]">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Sécurité garantie</h3>
            <p className="text-gray-600">Vos données médicales sont protégées et sécurisées.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à simplifier la gestion de vos rendez-vous ?
          </h2>
          <p className="text-gray-600 mb-6">
            Rejoignez Remind dès aujourd'hui et prenez le contrôle de votre agenda médical.
          </p>
          <Link 
            href="/register" 
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white font-bold shadow hover:from-gray-500 hover:to-gray-700 transition-colors text-base border border-gray-300 cursor-pointer"
          >
            Commencer maintenant
          </Link>
        </div>
      </main>
    </div>
  )
}
