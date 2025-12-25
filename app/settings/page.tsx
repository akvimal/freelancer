"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState<string>('')
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZipCode: '',
    businessCountry: '',
    taxId: '',
    gstNumber: '',
    panNumber: '',
    bankAccountHolder: '',
    bankName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    bankSwiftCode: '',
    bankIban: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPassword: '',
    emailFromName: '',
    emailFromAddress: '',
    signature: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          businessName: data.businessName || '',
          businessEmail: data.businessEmail || '',
          businessPhone: data.businessPhone || '',
          businessAddress: data.businessAddress || '',
          businessCity: data.businessCity || '',
          businessState: data.businessState || '',
          businessZipCode: data.businessZipCode || '',
          businessCountry: data.businessCountry || '',
          taxId: data.taxId || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          bankAccountHolder: data.bankAccountHolder || '',
          bankName: data.bankName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankRoutingNumber: data.bankRoutingNumber || '',
          bankSwiftCode: data.bankSwiftCode || '',
          bankIban: data.bankIban || '',
          emailHost: data.emailHost || '',
          emailPort: data.emailPort || 587,
          emailUser: data.emailUser || '',
          emailPassword: data.emailPassword || '',
          emailFromName: data.emailFromName || '',
          emailFromAddress: data.emailFromAddress || '',
          signature: data.signature || ''
        })
        setSignaturePreview(data.signature || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      alert('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('Image size should be less than 1MB')
      return
    }

    // Compress and resize the image
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Set max dimensions (signature shouldn't be huge)
      const maxWidth = 600
      const maxHeight = 200

      let width = img.width
      let height = img.height

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to base64 with compression (quality 0.7)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)

      // Check final size (should be much smaller now)
      const sizeInKB = (compressedBase64.length * 3) / 4 / 1024
      console.log('Compressed signature size:', Math.round(sizeInKB), 'KB')

      setFormData({ ...formData, signature: compressedBase64 })
      setSignaturePreview(compressedBase64)
    }

    img.onerror = () => {
      alert('Failed to load image')
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your business information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              />
            </div>
            <Input
              label="Address"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="City"
                value={formData.businessCity}
                onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
              />
              <Input
                label="State"
                value={formData.businessState}
                onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
              />
              <Input
                label="Zip Code"
                value={formData.businessZipCode}
                onChange={(e) => setFormData({ ...formData, businessZipCode: e.target.value })}
              />
            </div>
            <Input
              label="Country"
              value={formData.businessCountry}
              onChange={(e) => setFormData({ ...formData, businessCountry: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g., 29ABCDE1234F1Z5"
              />
              <Input
                label="PAN Number"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                placeholder="e.g., ABCDE1234F"
              />
              <Input
                label="Tax ID"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Account Holder Name"
              value={formData.bankAccountHolder}
              onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
            />
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
            <Input
              label="Account Number"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Routing Number"
                value={formData.bankRoutingNumber}
                onChange={(e) => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
              />
              <Input
                label="SWIFT Code"
                value={formData.bankSwiftCode}
                onChange={(e) => setFormData({ ...formData, bankSwiftCode: e.target.value })}
              />
            </div>
            <Input
              label="IBAN"
              value={formData.bankIban}
              onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration (for sending invoices)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Gmail Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your Google Account settings</li>
                <li>Enable 2-Step Verification if not already enabled</li>
                <li>Go to Security → 2-Step Verification → App passwords</li>
                <li>Create an app password for "Mail"</li>
                <li>Use that 16-character password in the "Password" field below</li>
              </ol>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="SMTP Host"
                value={formData.emailHost}
                onChange={(e) => setFormData({ ...formData, emailHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
              <Input
                label="SMTP Port"
                type="number"
                value={formData.emailPort}
                onChange={(e) => setFormData({ ...formData, emailPort: parseInt(e.target.value) || 587 })}
                placeholder="587"
              />
            </div>

            <Input
              label="Email Username"
              type="email"
              value={formData.emailUser}
              onChange={(e) => setFormData({ ...formData, emailUser: e.target.value })}
              placeholder="your-email@gmail.com"
            />

            <Input
              label="Email Password (App Password)"
              type="password"
              value={formData.emailPassword}
              onChange={(e) => setFormData({ ...formData, emailPassword: e.target.value })}
              placeholder="16-character app password"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="From Name"
                value={formData.emailFromName}
                onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
                placeholder="Your Business Name"
              />
              <Input
                label="From Email Address"
                type="email"
                value={formData.emailFromAddress}
                onChange={(e) => setFormData({ ...formData, emailFromAddress: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Signature Image
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Upload a scanned signature image (PNG, JPG). This will appear on invoices and emails sent to clients.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {signaturePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-white inline-block">
                  <img
                    src={signaturePreview}
                    alt="Signature preview"
                    className="max-w-xs max-h-24 object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, signature: '' })
                    setSignaturePreview('')
                  }}
                  className="ml-4 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Signature
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
