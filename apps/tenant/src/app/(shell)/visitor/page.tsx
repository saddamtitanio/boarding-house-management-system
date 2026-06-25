'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  QrCode,
  Share2,
  Copy,
  Plus,
  Check,
  ExternalLink,
  Clock,
  ArrowRight,
  History,
  UserCheck,
  FileText,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { KosanCard, KosanButton, KosanBadge, useToast, LoadingSpinner } from '@sbhms/ui'

interface VisitorLog {
  id: string
  visitor_name: string
  visitor_phone: string
  purpose: string | null
  check_in_at: string
  check_out_at: string | null
  room: {
    name: string
  }
}

export default function VisitorQRPage() {
  const toast = useToast()
  const [genericQr, setGenericQr] = useState<string | null>(null)
  const [genericUrl, setGenericUrl] = useState<string | null>(null)
  const [loadingGeneric, setLoadingGeneric] = useState(true)

  // Custom pass generation
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [customQr, setCustomQr] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const [copiedCustom, setCopiedCustom] = useState(false)
  const [copiedGeneric, setCopiedGeneric] = useState(false)

  // Visitor logs
  const [logs, setLogs] = useState<VisitorLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [error, setError] = useState('')

  // Load generic QR pass (active booking dependent)
  async function fetchGenericQR() {
    try {
      setLoadingGeneric(true)
      const res = await fetch('/api/visit/qr')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load visitor pass')
        return
      }
      setGenericQr(data.qr)
      setGenericUrl(data.url)
    } catch (err) {
      setError('Failed to load visitor pass')
    } finally {
      setLoadingGeneric(false)
    }
  }

  // Generate a customized pass for a specific person
  async function handleGenerateCustomPass(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setGeneratingCustom(true)
      const res = await fetch(`/api/visit/qr?name=${encodeURIComponent(name)}&purpose=${encodeURIComponent(purpose)}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate pass')
        return
      }
      setCustomQr(data.qr)
      setCustomUrl(data.url)
    } catch (err) {
      toast.error('Error generating pass')
    } finally {
      setGeneratingCustom(false)
    }
  }

  // Load visitor logs
  async function fetchLogs() {
    try {
      setLoadingLogs(true)
      const res = await fetch('/api/visit/logs')
      const data = await res.json()
      if (res.ok) {
        setLogs(data || [])
      }
    } catch (err) {
      console.error('Failed to load logs', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchGenericQR()
    fetchLogs()
    
    // Poll for logs update
    const interval = setInterval(fetchLogs, 8000)
    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = (text: string, type: 'custom' | 'generic') => {
    navigator.clipboard.writeText(text)
    if (type === 'custom') {
      setCopiedCustom(true)
      setTimeout(() => setCopiedCustom(false), 2000)
    } else {
      setCopiedGeneric(true)
      setTimeout(() => setCopiedGeneric(false), 2000)
    }
  }

  const shareToWhatsApp = (url: string, visitorName: string) => {
    const text = visitorName 
      ? `Hi ${visitorName}! Here is your Kosan Mama visitor pass link. Please use it to check in when you arrive: ${url}`
      : `Hi! Here is the Kosan Mama visitor pass link. Please use it to check in when you arrive: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1A0E0A] p-6 flex flex-col items-center justify-center">
        <KosanCard className="max-w-md w-full text-center p-6 space-y-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-xl font-bold text-[#F5E6D3]">No Active Booking</h1>
          <p className="text-sm text-[#DFC9A8]">{error === 'NO_ACTIVE_BOOKING' ? 'You do not have an active room booking to invite visitors.' : error}</p>
        </KosanCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A0E0A] p-6 flex flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F5E6D3]">Visitor Passes</h1>
        <p className="text-sm text-[#DFC9A8] mt-1">Generate, share, and track entry passes for your visitors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass Creator */}
        <div className="lg:col-span-2 space-y-6">
          <KosanCard className="flex flex-col">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-4 flex items-center gap-2">
              <Plus size={18} className="text-[#C8A96E]" />
              Create Custom Pass
            </h2>
            
            <form onSubmit={handleGenerateCustomPass} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#553D2B]">Visitor Name</label>
                  <input
                    placeholder="e.g. Obi-Wan"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2.5 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#553D2B]">Purpose of Visit</label>
                  <input
                    placeholder="e.g. Social, Delivery, Study"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2.5 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                  />
                </div>
              </div>

              <KosanButton
                type="submit"
                variant="primary"
                loading={generatingCustom}
                disabled={generatingCustom || !name.trim()}
                className="w-full md:w-auto"
              >
                Generate Pass
              </KosanButton>
            </form>
          </KosanCard>

          {/* Custom Pass Display */}
          {customQr && customUrl && (
            <KosanCard className="border border-[#C8A96E] bg-[#DFC9A8]/20 flex flex-col md:flex-row items-center gap-6 p-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#C8A96E]/30 shrink-0">
                <Image src={customQr} alt="Custom Visitor Pass QR Code" width={180} height={180} />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
                <div>
                  <KosanBadge variant="gold">Custom Invite Pass</KosanBadge>
                  <h3 className="text-xl font-bold text-[#2C1A0E] mt-2 truncate">Pass for {name}</h3>
                  {purpose && <p className="text-sm text-[#8B6F5E] mt-1 italic">Purpose: "{purpose}"</p>}
                  <p className="text-xs text-[#8B6F5E] mt-2 flex items-center justify-center md:justify-start gap-1">
                    <Clock size={12} /> Valid for 24 hours
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <KosanButton
                    variant="primary"
                    size="sm"
                    leftIcon={<Share2 size={14} />}
                    onClick={() => shareToWhatsApp(customUrl, name)}
                    className="!bg-[#20ba5a80] hover:!bg-[#20ba5a] text-white border-transparent"
                  >
                    WhatsApp Share
                  </KosanButton>
                  
                  <KosanButton
                    variant="secondary"
                    size="sm"
                    leftIcon={copiedCustom ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => copyToClipboard(customUrl, 'custom')}
                  >
                    {copiedCustom ? 'Copied' : 'Copy Link'}
                  </KosanButton>
                </div>
              </div>
            </KosanCard>
          )}
        </div>

        {/* Generic Pass / Quick Share */}
        <div className="lg:col-span-1">
          <KosanCard className="flex flex-col items-center text-center h-full justify-between p-6">
            <div className="space-y-4 w-full">
              <h2 className="text-lg font-bold text-[#2C1A0E] flex items-center justify-center gap-2">
                <QrCode size={18} className="text-[#C8A96E]" />
                Quick Generic Pass
              </h2>
              <p className="text-xs text-[#8B6F5E] px-2">
                Share this generic pass for quick entry. Visitors will fill in their details when scanning.
              </p>

              <div className="bg-white p-4 rounded-2xl border border-[#C8A96E]/20 mx-auto w-[180px] h-[180px] flex items-center justify-center shadow-sm">
                {loadingGeneric ? (
                  <div className="w-8 h-8 border-3 border-[#C8A96E] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  genericQr && <Image src={genericQr} alt="Generic QR Pass" width={160} height={160} />
                )}
              </div>
            </div>

            {genericUrl && (
              <div className="flex flex-col gap-2 w-full mt-4">
                <KosanButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Share2 size={14} />}
                  onClick={() => shareToWhatsApp(genericUrl, '')}
                  className="!bg-[#20ba5a80] hover:!bg-[#20ba5a] text-white border-transparent"
                >
                  WhatsApp Share
                </KosanButton>
                <KosanButton
                  variant="secondary"
                  size="sm"
                  leftIcon={copiedGeneric ? <Check size={14} /> : <Copy size={14} />}
                  onClick={() => copyToClipboard(genericUrl, 'generic')}
                >
                  {copiedGeneric ? 'Copied!' : 'Copy Pass Link'}
                </KosanButton>
              </div>
            )}
          </KosanCard>
        </div>
      </div>

      {/* Visitor Logs */}
      <KosanCard className="w-full">
        <h2 className="text-lg font-bold text-[#2C1A0E] mb-4 flex items-center gap-2">
          <History size={18} className="text-[#C8A96E]" />
          Recent Visitors Log
        </h2>

        {loadingLogs && logs.length === 0 ? (
          <LoadingSpinner message="Loading visitor logs..." fullScreen={false} />
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-[#8B6F5E] space-y-2">
            <UserCheck size={36} className="mx-auto text-[#C8A96E]/30" />
            <p className="font-semibold text-sm text-[#2C1A0E]">No recent visitors</p>
            <p className="text-xs max-w-xs mx-auto">When your visitors scan their passes to check in or out, their details will display here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#C8A96E]/20 text-xs font-bold text-[#553D2B] uppercase tracking-wider">
                    <th className="pb-3 pt-1 pl-1">Visitor Name</th>
                    <th className="pb-3 pt-1">Phone Number</th>
                    <th className="pb-3 pt-1">Purpose</th>
                    <th className="pb-3 pt-1">Check In</th>
                    <th className="pb-3 pt-1">Check Out</th>
                    <th className="pb-3 pt-1 pr-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C8A96E]/10 text-sm text-[#2C1A0E]">
                  {logs.map((log) => {
                    const checkInTime = new Date(log.check_in_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    const checkOutTime = log.check_out_at 
                      ? new Date(log.check_out_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    const isActive = !log.check_out_at

                    return (
                      <tr key={log.id} className="hover:bg-[#DFC9A8]/10 transition-colors">
                        <td className="py-3 pl-1 font-semibold">{log.visitor_name}</td>
                        <td className="py-3 text-[#8B6F5E]">{log.visitor_phone}</td>
                        <td className="py-3">{log.purpose || <span className="text-xs text-[#8B6F5E]/60 italic">Generic</span>}</td>
                        <td className="py-3 text-xs text-[#8B6F5E]">{checkInTime}</td>
                        <td className="py-3 text-xs text-[#8B6F5E]">{checkOutTime}</td>
                        <td className="py-3 pr-1 text-right">
                          <KosanBadge variant={isActive ? 'info' : 'success'}>
                            {isActive ? 'Active (Inside)' : 'Checked Out'}
                          </KosanBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards layout */}
            <div className="md:hidden divide-y divide-[#C8A96E]/10">
              {logs.map((log) => {
                const checkInTime = new Date(log.check_in_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                const checkOutTime = log.check_out_at 
                  ? new Date(log.check_out_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-'
                const isActive = !log.check_out_at

                return (
                  <div key={log.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#2C1A0E]">{log.visitor_name}</span>
                      <KosanBadge variant={isActive ? 'info' : 'success'}>
                        {isActive ? 'Active (Inside)' : 'Checked Out'}
                      </KosanBadge>
                    </div>
                    <div className="text-xs text-[#8B6F5E] space-y-2 bg-[#DFC9A8]/10 rounded-xl p-3 border border-[#C8A96E]/10">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#8B6F5E]">Phone:</span>
                        <span className="text-[#2C1A0E] font-medium">{log.visitor_phone}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#8B6F5E]">Purpose:</span>
                        <span className="text-[#2C1A0E] font-medium break-words">{log.purpose || 'Generic'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#8B6F5E]">Check In:</span>
                        <span className="text-[#2C1A0E] font-medium">{checkInTime}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#8B6F5E]">Check Out:</span>
                        <span className="text-[#2C1A0E] font-medium">{checkOutTime}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </KosanCard>
    </div>
  )
}