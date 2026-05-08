'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function VisitorQRPage() {
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchQR() {
    setLoading(true)
    const res = await fetch('/api/visit/qr')
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setQr(data.qr)
    setLoading(false)
  }

  useEffect(() => {
    fetchQR()

    const interval = setInterval(fetchQR, 23 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (error) return <p className="text-red-500">{error}</p>
  if (loading) return <p>Generating QR...</p>

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl font-semibold">Your Visitor QR Code</h1>
      <p className="text-sm text-gray-500">
        Show or send this to your visitors. Valid for 24 hours.
      </p>
      {qr && <Image src={qr} alt="Visitor QR Code" width={256} height={256} />}
      <button onClick={fetchQR} className="text-sm underline">
        Regenerate
      </button>
    </div>
  )
}