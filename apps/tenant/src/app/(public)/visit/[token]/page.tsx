// Temporary UI

'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function VisitPage() {
  const { token } = useParams()
  const storageKey = `visit_id_${token}` 
  
  const [form, setForm] = useState({ name: '', phone: '', purpose: '', countryCode: '+62' })
  const [step, setStep] = useState<'form' | 'checkedin' | 'checkedout'>('form')
  const [visitId, setVisitId] = useState<string | null>(null)
  
  // check if this visitor already checked in
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setVisitId(stored)
      setStep('checkedin')
    } else {
      setStep('form')
    }
  }, [storageKey])

  async function handleCheckIn() {
    const res = await fetch('/api/visit/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, 
        visitor_name: form.name,
        visitor_phone: form.phone,
        purpose: form.purpose,
      }),
    })

    const data = await res.json()
    if (!res.ok) return alert(data.error)
    
    localStorage.setItem(storageKey, data.id)

    setVisitId(data.id)
    setStep('checkedin')
  }

  async function handleCheckOut() {
    const res = await fetch('/api/visit/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visit_id: visitId }),
    })
    if (!res.ok) return alert('Check out failed')
    localStorage.removeItem(storageKey)
    setStep('checkedout')
  }

  if (step === 'checkedin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 rounded-lg max-w-md w-full text-center">
          <p className="text-lg mb-4">You are checked in. Scan QR again when leaving.</p>
          <button
            onClick={handleCheckOut}
            className="bg-[#AE8A62] hover:bg-[#8C6A4A] text-white font-bold py-2 px-4 rounded w-full cursor-pointer"
          >
            Check Out Now
          </button>
        </div>
      </div>
    )
  }

  if (step === 'checkedout') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-lg max-w-md w-full text-center">
          <p className="text-lg">You have checked out. Goodbye!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Visitor Check-In</h1>
        <div className="space-y-4">
          <input
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Phone number"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Purpose of visit"
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCheckIn}
            className="w-full bg-[#AE8A62] hover:bg-[#8C6A4A] text-white font-bold py-2 px-4 rounded-md cursor-pointer"
          >
            Check In
          </button>
        </div>
      </div>
    </div>
  )
}