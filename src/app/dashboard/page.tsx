'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Appointment } from '@/lib/supabase'
import { Brain, Users } from 'lucide-react'
import { format, parseISO, subHours, isPast } from 'date-fns'

// Mapping des boîtiers pour chaque patient
const boitierMapping: { [key: string]: string } = {
  '15856b1b-61ab-4670-a211-b073f25faa95': 'Boîtier A-123',
  '2d7abb1f-06fb-4520-ba8e-7b096f90eb47': 'Boîtier B-456',
  '2f5e4f4e-4600-4291-a778-0521e2b7a4a6': 'Boîtier C-789',
  '3de84203-a42f-4330-9cce-7dda9d00b4b1': 'Boîtier D-012'
}

function toDatetimeLocal(dateStr: string) {
  // Convertit une date UTC en string pour input datetime-local (en local)
  const date = parseISO(dateStr)
  const dateMinusTwoHours = subHours(date, 2)
  return format(dateMinusTwoHours, "yyyy-MM-dd'T'HH:mm")
}

function toUTCFromLocal(localStr: string) {
  // Convertit une string de input datetime-local (en local) en UTC ISO string
  const localDate = new Date(localStr)
  const datePlusTwoHours = new Date(localDate.getTime() + 2 * 60 * 60 * 1000)
  return datePlusTwoHours.toISOString()
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { if (selectedUser) fetchAppointments(selectedUser.uuid) }, [selectedUser])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return
    setUsers(data || [])
  }
  const fetchAppointments = async (userUuid: string) => {
    const { data, error } = await supabase.from('rdv').select('*').eq('user', userUuid).order('date', { ascending: true })
    if (error) return
    setAppointments(data || [])
  }
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment({ ...appointment, date: toDatetimeLocal(appointment.date) })
    setIsEditing(true)
    setShowForm(false)
    setTimeout(() => setShowForm(true), 10)
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
    setIsEditing(false); setEditingAppointment(null); setShowForm(false)
  }

  // Animation helpers
  const openForm = () => {
    setIsEditing(false)
    setShowForm(false)
    setTimeout(() => {
      setIsEditing(true)
      setShowForm(true)
    }, 10)
  }
  const closeForm = () => {
    setIsEditing(false)
    setEditingAppointment(null)
    setShowForm(false)
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
        <div className="mt-2 text-lg text-[#2E8B8B] font-medium tracking-wide">Tableau de bord</div>
      </header>
      {/* Main content */}
      <main className="max-w-6xl mx-auto pb-10 px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Utilisateurs */}
        <section className="col-span-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 flex flex-col border border-[#E0EAEA]">

          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#2E8B8B]" /> Patients
          </h2>
          <div className="flex-1 overflow-y-auto pr-1">
            {users.length === 0 && <div className="text-gray-400 text-center py-8">Aucun utilisateur</div>}
            <ul className="space-y-3">
              {users.map((user) => (
                <li key={user.uuid}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-2 text-lg font-semibold shadow-sm focus:outline-none cursor-pointer
                                            ${selectedUser?.uuid === user.uuid ? 'bg-gradient-to-r from-white to-[#D1ECEC] border-[#E0EAEA] text-gray-900 shadow-md' : 'bg-white border-transparent hover:bg-gray-50 text-gray-800'}`}
                  >
                    <span className="w-11 h-11 rounded-full bg-[#2E8B8B] flex items-center justify-center text-gray-100 font-bold text-xl shadow">
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </span>
                    <div className="flex flex-col">
                      <span>{user.prenom} {user.nom}</span>
                      <span className="text-sm text-[#2E8B8B] font-medium">{boitierMapping[user.uuid] || 'Boîtier non assigné'}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
        {/* Rendez-vous */}
        <section className="col-span-2 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl p-10 min-h-[400px] flex flex-col border border-[#E0EAEA]">

          {selectedUser ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                <span className="w-16 h-16 rounded-full bg-[#2E8B8B] flex items-center justify-center text-gray-100 font-extrabold text-2xl shadow">

                    {selectedUser.prenom.charAt(0)}{selectedUser.nom.charAt(0)}
                  </span>
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{selectedUser.prenom} {selectedUser.nom}</h2>
                    <p className="text-[#2E8B8B] text-base">Rendez-vous du patient</p>

                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAppointment({ id: -1, titre: '', contenu: '', date: '', user: selectedUser.uuid, created_at: '' });
                    openForm();
                  }}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white font-bold shadow hover:from-gray-500 hover:to-gray-700 transition-colors text-base border border-gray-300 cursor-pointer"

                >
                  + Nouveau rendez-vous
                </button>
              </div>
              {isEditing && editingAppointment && showForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingAppointment) return;
                    if (editingAppointment.id === -1) {
                      const { error } = await supabase.from('rdv').insert([{ titre: editingAppointment.titre, contenu: editingAppointment.contenu, date: toUTCFromLocal(editingAppointment.date), user: selectedUser.uuid }]);
                      if (error) return;
                      fetchAppointments(selectedUser.uuid);
                    } else {
                      await handleUpdateAppointment(e);
                    }
                    closeForm();
                  }}
                  className="space-y-4 mb-10 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 animate-fade-in"
                  style={{ animation: 'fadeInSlide .4s cubic-bezier(.4,0,.2,1)' }}
                >
                  <div>
                    <label className="block text-base font-medium text-gray-700">Titre</label>
                    <input
                      type="text"
                      value={editingAppointment.titre}
                      onChange={e => setEditingAppointment({ ...editingAppointment, titre: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-gray-400 focus:ring-gray-400 text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                      placeholder="Titre du rendez-vous"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700">Contenu</label>
                    <textarea
                      value={editingAppointment.contenu}
                      onChange={e => setEditingAppointment({ ...editingAppointment, contenu: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-gray-400 focus:ring-gray-400 text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                      placeholder="Détail du rendez-vous"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700">Date</label>
                    <input
                      type="datetime-local"
                      value={editingAppointment.date}
                      onChange={e => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-gray-400 focus:ring-gray-400 text-lg text-gray-900 bg-gray-50 placeholder-gray-400 px-4 py-2"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="bg-gradient-to-r from-[#00A8A8] to-[#2E8B8B] text-white px-5 py-2 rounded-md font-bold hover:from-gray-500 hover:to-gray-700 border border-gray-300 cursor-pointer">{editingAppointment.id === -1 ? 'Ajouter' : 'Sauvegarder'}</button>
                    <button type="button" onClick={closeForm} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md font-bold hover:bg-gray-300 border border-gray-300 cursor-pointer">Annuler</button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {appointments.length === 0 ? (
                  <div className="text-gray-300 col-span-2 text-center py-12 text-lg">Aucun rendez-vous pour ce patient.</div>
                ) : (
                  <>
                    {/* Rendez-vous à venir */}
                    <div className="col-span-2">
                      <h3 className="text-xl font-bold text-[#2E8B8B] mb-4">À venir</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {appointments
                          .filter(appointment => !isPast(parseISO(appointment.date)))
                          .map((appointment) => (
                            <div key={appointment.id} className="bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 shadow flex flex-col gap-2 hover:shadow-lg transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 text-lg">{appointment.titre}</h4>
                                <button 
                                  onClick={() => handleEditAppointment(appointment)} 
                                  className="text-[#2E8B8B] hover:text-gray-900 font-semibold text-sm cursor-pointer"
                                >
                                  Modifier
                                </button>
                              </div>
                              <p className="text-gray-900 text-base mb-1">{appointment.contenu}</p>
                              <div className="flex items-center gap-2 text-[#2E8B8B] text-base font-medium">
                                <span>🕒</span>
                                {format(subHours(parseISO(appointment.date), 2), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Rendez-vous passés */}
                    <div className="col-span-2">
                      <h3 className="text-xl font-bold text-[#2E8B8B] mb-4">Passés</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {appointments
                          .filter(appointment => isPast(parseISO(appointment.date)))
                          .map((appointment) => (
                            <div key={appointment.id} className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 border border-gray-200 rounded-xl p-6 shadow flex flex-col gap-2 opacity-75">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 text-lg">{appointment.titre}</h4>
                              </div>
                              <p className="text-gray-900 text-base mb-1">{appointment.contenu}</p>
                              <div className="flex items-center gap-2 text-[#2E8B8B] text-base font-medium">
                                <span>🕒</span>
                                {format(subHours(parseISO(appointment.date), 2), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-200">
              <span className="text-5xl mb-4">👈</span>
              <p className="text-xl font-semibold">Sélectionnez un patient pour voir ses rendez-vous</p>
            </div>
          )}
        </section>
      </main>
      <style jsx global>{`
        @keyframes fadeInSlide {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInSlide .4s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  )
} 