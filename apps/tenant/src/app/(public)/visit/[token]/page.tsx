'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, User, Phone, Compass, LogOut, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { useToast } from '@sbhms/ui'

export default function VisitPage() {
  const { token } = useParams()
  const storageKey = `visit_id_${token}` 
  const toast = useToast()
  
  const [form, setForm] = useState({ name: '', phone: '', purpose: '', countryCode: '+62' })
  const [step, setStep] = useState<'loading' | 'form' | 'checkedin' | 'checkedout' | 'error'>('loading')
  const [visitId, setVisitId] = useState<string | null>(null)
  
  const [tenantName, setTenantName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Verify pass and check local storage for checkedin state
  useEffect(() => {
    async function verifyPass() {
      try {
        const res = await fetch(`/api/visit/verify?token=${token}`)
        const data = await res.json()
        
        if (!res.ok || !data.success) {
          setVerifyError(data.error || 'Invalid or expired visitor pass')
          setStep('error')
          return
        }

        setTenantName(data.tenant_name)
        setRoomName(data.room_name)
        
        // Prefill form details if encoded in token
        setForm(f => ({
          ...f,
          name: data.visitor_name || '',
          purpose: data.purpose || ''
        }))

        // Check if visitor is already checked in
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          setVisitId(stored)
          setStep('checkedin')
        } else {
          setStep('form')
        }
      } catch (err) {
        setVerifyError('Failed to verify visitor pass')
        setStep('error')
      }
    }

    if (token) {
      verifyPass()
    }
  }, [token, storageKey])

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      toast.warning('Name and Phone number are required')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/visit/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, 
          visitor_name: form.name,
          visitor_phone: form.phone,
          purpose: form.purpose,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Check-in failed')
        return
      }
      
      localStorage.setItem(storageKey, data.id)
      setVisitId(data.id)
      setStep('checkedin')
    } catch (err) {
      toast.error('An error occurred during check-in')
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    try {
      setSubmitting(true)
      const res = await fetch('/api/visit/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: visitId }),
      })
      
      if (!res.ok) {
        toast.error('Check out failed. You might have already checked out.')
        return
      }
      
      localStorage.removeItem(storageKey)
      setStep('checkedout')
    } catch (err) {
      toast.error('An error occurred during check-out')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C8A96E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F5E] text-sm font-semibold">Verifying Visitor Pass...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
        <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-[#2C1A0E]">Access Denied</h1>
          <p className="text-sm text-[#8B6F5E]">{verifyError}</p>
          <p className="text-xs text-[#8B6F5E]/70">
            Please ask the host (tenant) to generate and share a new visitor pass link.
          </p>
        </div>
      </div>
    )
  }

  if (step === 'checkedin') {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
        <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="p-3 bg-green-100 text-green-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2C1A0E]">Checked In</h1>
            <p className="text-sm text-[#8B6F5E] mt-1">You are registered as a visitor at Kosan Mama</p>
          </div>

          <div className="bg-[#DFC9A8]/30 rounded-2xl p-4 space-y-2 text-left text-sm">
            <p className="text-[#2C1A0E]"><strong className="text-[#553D2B]">Host:</strong> {tenantName}</p>
            <p className="text-[#2C1A0E]"><strong className="text-[#553D2B]">Room:</strong> {roomName}</p>
            <p className="text-[#2C1A0E]"><strong className="text-[#553D2B]">Visitor Name:</strong> {form.name}</p>
          </div>

          <p className="text-xs text-[#8B6F5E]">
            Please keep this tab open or scan the QR code again when you are ready to check out and leave the building.
          </p>

          <button
            onClick={handleCheckOut}
            disabled={submitting}
            className="w-full bg-[#553D2B] hover:bg-[#3d2b1f] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Check Out Now
          </button>
        </div>
      </div>
    )
  }

  if (step === 'checkedout') {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
        <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2C1A0E]">Check-Out Complete</h1>
            <p className="text-sm text-[#8B6F5E] mt-1">Thank you for visiting Kosan Mama</p>
          </div>
          <p className="text-xs text-[#8B6F5E]/70 leading-relaxed">
            Your visit has been successfully logged. Have a safe trip!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
      <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 p-8 rounded-3xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#2C1A0E] text-center mb-2">Visitor Check-In</h1>
        <p className="text-xs text-[#8B6F5E] text-center mb-6">Welcome to Kosan Mama boarding house</p>

        <div className="bg-[#DFC9A8]/40 border border-[#C8A96E]/20 rounded-2xl p-4 text-center mb-6">
          <p className="text-[10px] text-[#8B6F5E] uppercase tracking-wider font-bold mb-1">Host Information</p>
          <h3 className="font-bold text-base text-[#2C1A0E]">Visiting {tenantName}</h3>
          <p className="text-xs text-[#8B6F5E] mt-1 flex items-center justify-center gap-1">
            <MapPin size={12} className="text-[#C8A96E]" /> {roomName}
          </p>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#553D2B] flex items-center gap-1.5">
              <User size={13} /> Visitor Name
            </label>
            <input
              placeholder="Enter your full name"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white border border-[#C8A96E]/40 focus:border-[#553D2B] focus:ring-1 focus:ring-[#553D2B] rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#553D2B] flex items-center gap-1.5">
              <Phone size={13} /> Phone Number
            </label>
            <input
              placeholder="e.g. 08123456789"
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-white border border-[#C8A96E]/40 focus:border-[#553D2B] focus:ring-1 focus:ring-[#553D2B] rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#553D2B] flex items-center gap-1.5">
              <Compass size={13} /> Purpose of Visit
            </label>
            <input
              placeholder="e.g. Social, Family, Delivery"
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              className="w-full bg-white border border-[#C8A96E]/40 focus:border-[#553D2B] focus:ring-1 focus:ring-[#553D2B] rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#553D2B] hover:bg-[#3d2b1f] disabled:bg-[#553D2B]/50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-sm flex items-center justify-center gap-2 mt-6"
          >
            Check In
          </button>
        </form>
      </div>
    </div>
  )
}