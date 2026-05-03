// Temporary UI

'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function VisitPage() {
  const { token } = useParams()
  const [form, setForm] = useState({ name: '', phone: '', purpose: '' })
  const [step, setStep] = useState<'form' | 'checkedin' | 'checkedout'>('form')
  const [visitId, setVisitId] = useState<string | null>(null)

  async function handleCheckIn() {
    const res = await fetch('/api/visit/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...form }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
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
    setStep('checkedout')
  }

  if (step === 'checkedin') {
    return (
        <div>
        <p>You are checked in. Scan QR again when leaving.</p>
        <button onClick={handleCheckOut}>Check Out Now</button>
        </div>
    )
}

  if (step === 'checkedout') {
    return <p>You have checked out. Goodbye!</p>
  }

  return (
    <div>
      <h1>Visitor Check-In</h1>
      <input placeholder="Your name" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <input placeholder="Phone number" value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
      <input placeholder="Purpose of visit" value={form.purpose}
        onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
      <button onClick={handleCheckIn}>Check In</button>
    </div>
  )
}