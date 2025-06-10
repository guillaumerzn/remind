'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, Appointment } from '@/lib/supabase'
import { Brain, Users, Calendar, ArrowLeft, Plus, Clock, Edit2, ChevronRight, Stethoscope, Pill, Heart, Dumbbell, MoreHorizontal } from 'lucide-react'
import { format, parseISO, subHours, isPast } from 'date-fns'

// Mapping des boîtiers pour chaque patient
const boitierMapping: { [key: string]: string } = {
  '15856b1b-61ab-4670-a211-b073f25faa95': 'Boîtier A-123',
  '2d7abb1f-06fb-4520-ba8e-7b096f90eb47': 'Boîtier B-456',
  '2f5e4f4e-4600-4291-a778-0521e2b7a4a6': 'Boîtier C-789',
  '3de84203-a42f-4330-9cce-7dda9d00b4b1': 'Boîtier D-012'
}

// Types de rendez-vous
const appointmentTypes = [
  {
    id: 'rdv_medical',
    label: 'RDV médical',
    icon: Stethoscope,
    color: 'bg-blue-600',
    details: [
      'Consultation généraliste',
      'Consultation spécialiste',
      'Examen médical',
      'Bilan de santé',
      'Suivi médical'
    ]
  },
  {
    id: 'ordonnance',
    label: 'Ordonnance pharma',
    icon: Pill,
    color: 'bg-green-600',
    details: [
      'Renouvellement ordonnance',
      'Nouvelle prescription',
      'Médicaments chroniques',
      'Traitement ponctuel',
      'Vaccin'
    ]
  },
  {
    id: 'infirmiere',
    label: 'Passage Infirmière',
    icon: Heart,
    color: 'bg-red-600',
    details: [
      'Prise de sang',
      'Injection',
      'Pansement',
      'Soins à domicile',
      'Contrôle tension'
    ]
  },
  {
    id: 'kine',
    label: 'Kiné',
    icon: Dumbbell,
    color: 'bg-purple-600',
    details: [
      'Séance kiné',
      'Rééducation',
      'Massage thérapeutique',
      'Exercices',
      'Bilan kinésithérapie'
    ]
  },
  {
    id: 'autre',
    label: 'Autre',
    icon: MoreHorizontal,
    color: 'bg-gray-600',
    details: [
      'Dentiste',
      'Ophtalmologue',
      'Laboratoire',
      'Radiologie',
      'Autre spécialiste'
    ]
  }
]

function toDatetimeLocal(dateStr: string) {
  const date = parseISO(dateStr)
  const dateMinusTwoHours = subHours(date, 2)
  return format(dateMinusTwoHours, "yyyy-MM-dd'T'HH:mm")
}

function toUTCFromLocal(localStr: string) {
  const localDate = new Date(localStr)
  const datePlusTwoHours = new Date(localDate.getTime() + 2 * 60 * 60 * 1000)
  return datePlusTwoHours.toISOString()
}

type View = 'patients' | 'appointments' | 'create-type' | 'create-details' | 'edit-form'

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentView, setCurrentView] = useState<View>('patients')
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedDetail, setSelectedDetail] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    fetchUsers()

    // Handle URL routing
    const patientId = searchParams.get('patient')
    if (patientId) {
      // Find user and set view to appointments
      fetchUsers().then(() => {
        const user = users.find(u => u.uuid === patientId)
        if (user) {
          setSelectedUser(user)
          setCurrentView('appointments')
        }
      })
    } else {
      setCurrentView('patients')
      setSelectedUser(null)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedUser) {
      fetchAppointments(selectedUser.uuid)
      // Update URL when patient is selected
      if (currentView === 'appointments') {
        router.push(`/?patient=${selectedUser.uuid}`, { scroll: false })
      }
    }
  }, [selectedUser, currentView])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return
    setUsers(data || [])

    // Handle direct patient link after users are loaded
    const patientId = searchParams.get('patient')
    if (patientId && data) {
      const user = data.find(u => u.uuid === patientId)
      if (user) {
        setSelectedUser(user)
        setCurrentView('appointments')
      }
    }
  }

  const fetchAppointments = async (userUuid: string) => {
    const { data, error } = await supabase.from('rdv').select('*').eq('user', userUuid).order('date', { ascending: true })
    if (error) return
    setAppointments(data || [])
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setCurrentView('appointments')
    router.push(`/?patient=${user.uuid}`, { scroll: false })
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment({ ...appointment, date: toDatetimeLocal(appointment.date) })
    setCurrentView('edit-form')
  }

  const handleCreateReminder = () => {
    setSelectedType('')
    setSelectedDetail('')
    setSelectedDate('')
    setCurrentView('create-type')
  }

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId)
    setCurrentView('create-details')
  }

  const handleCreateAppointment = async () => {
    if (!selectedUser || !selectedType || !selectedDetail || !selectedDate) return

    const selectedTypeData = appointmentTypes.find(t => t.id === selectedType)
    const titre = selectedTypeData?.label || ''
    const contenu = selectedDetail

    const { error } = await supabase.from('rdv').insert([{
      titre,
      contenu,
      date: toUTCFromLocal(selectedDate),
      user: selectedUser.uuid
    }])

    if (error) return

    fetchAppointments(selectedUser.uuid)
    setCurrentView('appointments')
  }

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAppointment) return

    const { error } = await supabase.from('rdv').update({
      titre: editingAppointment.titre,
      contenu: editingAppointment.contenu,
      date: toUTCFromLocal(editingAppointment.date)
    }).eq('id', editingAppointment.id)

    if (error) return

    if (selectedUser) fetchAppointments(selectedUser.uuid)
    setCurrentView('appointments')
    setEditingAppointment(null)
  }

  const goBack = () => {
    if (currentView === 'create-details') {
      setCurrentView('create-type')
    } else if (currentView === 'create-type' || currentView === 'edit-form') {
      setCurrentView('appointments')
      setEditingAppointment(null)
    } else if (currentView === 'appointments') {
      setCurrentView('patients')
      setSelectedUser(null)
      router.push('/', { scroll: false })
    }
  }

  const upcomingAppointments = appointments.filter(appointment => !isPast(parseISO(appointment.date)))
  const pastAppointments = appointments.filter(appointment => isPast(parseISO(appointment.date)))

  return (
    <div className="min-h-screen bg-white">      
      {/* Content */}
      <main className="pb-8">
        {/* Patients View */}
        {currentView === 'patients' && (
          <div className="px-4 py-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patients</h2>
              <p className="text-gray-600">Sélectionnez un patient</p>
            </div>

            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.uuid}
                  onClick={() => handleSelectUser(user)}
                  className="w-full bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {user.prenom} {user.nom}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {boitierMapping[user.uuid] || 'Boîtier non assigné'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun patient</p>
              </div>
            )}
          </div>
        )}

        {/* Appointments View */}
        {currentView === 'appointments' && selectedUser && (
          <div>
            {/* Back Button */}
            <div className="px-4 pt-4">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux patients
              </button>
            </div>

            {/* Patient Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xl">
                  {selectedUser.prenom.charAt(0)}{selectedUser.nom.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser.prenom} {selectedUser.nom}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {boitierMapping[selectedUser.uuid] || 'Boîtier non assigné'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateReminder}
                className="w-full bg-gray-900 text-white rounded-lg py-3 px-4 font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Créer un rappel
              </button>
            </div>

            {/* Appointments List */}
            <div className="px-4 py-6 space-y-8">
              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-700" />
                    À venir
                  </h3>
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-lg flex-1">
                            {appointment.titre}
                          </h4>
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-700 mb-3">{appointment.contenu}</p>
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {format(subHours(parseISO(appointment.date), 2), 'dd/MM/yyyy à HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Passés</h3>
                  <div className="space-y-3">
                    {pastAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-60">
                        <h4 className="font-semibold text-gray-900 mb-2">{appointment.titre}</h4>
                        <p className="text-gray-700 mb-3">{appointment.contenu}</p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          {format(subHours(parseISO(appointment.date), 2), 'dd/MM/yyyy à HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {appointments.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Aucun rendez-vous</p>
                  <p className="text-gray-400 text-sm">Créez le premier rappel</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Type Selection View */}
        {currentView === 'create-type' && (
          <div className="px-4 py-6">
            {/* Back Button */}
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux rendez-vous
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Type de rappel</h2>
              <p className="text-gray-600">Choisissez le type</p>
            </div>

            <div className="space-y-3">
              {appointmentTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className="w-full bg-white rounded-lg p-6 border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center text-white shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {type.label}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Create Details View */}
        {currentView === 'create-details' && selectedType && (
          <div className="px-4 py-6">
            {/* Back Button */}
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux types
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Détails</h2>
              <p className="text-gray-600">
                {appointmentTypes.find(t => t.id === selectedType)?.label}
              </p>
            </div>

            <div className="space-y-6">
              {/* Detail Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Précisez :</h3>
                <div className="space-y-3">
                  {appointmentTypes
                    .find(t => t.id === selectedType)
                    ?.details.map((detail) => (
                      <button
                        key={detail}
                        onClick={() => setSelectedDetail(detail)}
                        className={`w-full p-4 rounded-lg border transition-all text-left font-medium ${selectedDetail === detail
                            ? 'border-gray-900 bg-gray-100 text-gray-900'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                          }`}
                      >
                        {detail}
                      </button>
                    ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Date et heure :
                </label>
                <input
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateAppointment}
                disabled={!selectedDetail || !selectedDate}
                className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Créer le rappel
              </button>
            </div>
          </div>
        )}

        {/* Edit Form View */}
        {currentView === 'edit-form' && editingAppointment && (
          <div className="px-4 py-6">
            {/* Back Button */}
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux rendez-vous
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier</h2>
              {selectedUser && (
                <p className="text-gray-600">
                  {selectedUser.prenom} {selectedUser.nom}
                </p>
              )}
            </div>

            <form onSubmit={handleUpdateAppointment} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editingAppointment.titre}
                  onChange={e => setEditingAppointment({ ...editingAppointment, titre: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={editingAppointment.contenu}
                  onChange={e => setEditingAppointment({ ...editingAppointment, contenu: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg resize-none"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={editingAppointment.date}
                  onChange={e => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                >
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors active:scale-[0.98]"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
} 