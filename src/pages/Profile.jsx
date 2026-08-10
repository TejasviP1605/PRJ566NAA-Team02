import { useEffect, useState } from 'react'
import { Building2, Lock, Mail, MapPin, Phone, Plus, Save, Trash2, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import AddressLookup, { formatAddressParts, partsFromDetails } from '../components/AddressLookup'

function CreateHouseholdSection() {
  const { createHousehold, loading } = useApp()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [address, setAddress] = useState('')
  const [addressDetails, setAddressDetails] = useState(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const finalAddress =
        address.trim() ||
        formatAddressParts(addressDetails) ||
        ''
      if (!finalAddress) {
        setError('Enter a household address (use search or fill street/city/province).')
        return
      }
      const result = await createHousehold({
        name,
        unit: unit || addressDetails?.unit || '',
        address: finalAddress,
        phone,
      })
      if (!result.ok) {
        setError(result.message || 'Could not create household.')
        return
      }
      setName('')
      setUnit('')
      setAddress('')
      setAddressDetails(null)
      setPhone('')
    } catch (err) {
      setError(err.message || 'Could not create household.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-slate-900 flex items-center gap-2">
        <Plus className="w-5 h-5 text-teal-700" />
        Create household
      </h2>
      <p className="text-slate-600 text-sm">
        Create a new household from your profile. You can belong to more than one.
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">Household name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maple House"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Your phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <AddressLookup
          value={address}
          parts={addressDetails}
          searchLabel="Search household address"
          showUnit
          onChange={({ address: nextAddress, addressDetails: details }) => {
            setAddress(nextAddress)
            setAddressDetails(details)
            if (details?.unit) setUnit(details.unit)
          }}
        />
        <div>
          <label className="text-sm text-slate-600">Unit / room (optional override)</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. Unit 2B"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || loading}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
        >
          {loading ? 'Loading…' : submitting ? 'Creating…' : 'Create Household'}
        </button>
      </form>
    </section>
  )
}

export default function Profile() {
  const {
    profile,
    currentUser,
    household,
    hasActiveHousehold,
    updateProfile,
    changePassword,
    updateHousehold,
    deleteHousehold,
  } = useApp()

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [accountMsg, setAccountMsg] = useState(null)
  const [accountSaving, setAccountSaving] = useState(false)

  const [address, setAddress] = useState('')
  const [addressDetails, setAddressDetails] = useState(null)
  const [addressMsg, setAddressMsg] = useState(null)
  const [addressSaving, setAddressSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [hhName, setHhName] = useState('')
  const [hhUnit, setHhUnit] = useState('')
  const [hhAddress, setHhAddress] = useState('')
  const [hhAddressDetails, setHhAddressDetails] = useState(null)
  const [hhMsg, setHhMsg] = useState(null)
  const [hhSaving, setHhSaving] = useState(false)
  const [hhDeleting, setHhDeleting] = useState(false)

  const email = profile?.email ?? currentUser?.email ?? ''

  useEffect(() => {
    setDisplayName(profile?.display_name ?? currentUser?.name ?? '')
    setPhone(profile?.phone ?? '')
    setAddress(profile?.address ?? '')
    setAddressDetails(partsFromDetails(profile?.address_details) )
  }, [
    profile?.display_name,
    profile?.phone,
    profile?.address,
    profile?.address_details,
    currentUser?.name,
  ])

  useEffect(() => {
    if (household) {
      setHhName(household.name ?? '')
      setHhUnit(household.unit ?? '')
      setHhAddress(household.address ?? '')
      setHhAddressDetails(null)
    }
  }, [household?.id, household?.name, household?.unit, household?.address])

  const handleAccountSave = async (e) => {
    e.preventDefault()
    setAccountSaving(true)
    setAccountMsg(null)
    const result = await updateProfile({ displayName, phone })
    setAccountSaving(false)
    if (!result.ok) setAccountMsg({ ok: false, text: result.message })
    else setAccountMsg({ ok: true, text: 'Profile updated.' })
  }

  const handleAddressSave = async (e) => {
    e.preventDefault()
    setAddressSaving(true)
    setAddressMsg(null)
    const result = await updateProfile({
      address: address || formatAddressParts(addressDetails),
      addressDetails,
    })
    setAddressSaving(false)
    if (!result.ok) setAddressMsg({ ok: false, text: result.message })
    else setAddressMsg({ ok: true, text: 'Address saved.' })
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' })
      return
    }
    setPasswordSaving(true)
    const result = await changePassword(newPassword)
    setPasswordSaving(false)
    if (!result.ok) setPasswordMsg({ ok: false, text: result.message })
    else {
      setPasswordMsg({ ok: true, text: 'Password changed successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleHouseholdSave = async (e) => {
    e.preventDefault()
    setHhSaving(true)
    setHhMsg(null)
    const result = await updateHousehold({
      name: hhName,
      unit: hhUnit || hhAddressDetails?.unit || '',
      address: hhAddress || formatAddressParts(hhAddressDetails),
    })
    setHhSaving(false)
    if (!result.ok) setHhMsg({ ok: false, text: result.message })
    else setHhMsg({ ok: true, text: 'Household details updated.' })
  }

  const handleDeleteHousehold = async () => {
    if (!household) return
    const ok = window.confirm(
      `Delete household “${household.name}”? This removes its members, expenses, documents, maintenance requests, and activity. This cannot be undone.`
    )
    if (!ok) return
    setHhDeleting(true)
    setHhMsg(null)
    const result = await deleteHousehold()
    setHhDeleting(false)
    if (!result.ok) setHhMsg({ ok: false, text: result.message })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage your account, address, password, and households.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-700" />
          Account information
        </h2>
        {accountMsg && (
          <p
            className={`rounded-lg border text-sm px-3 py-2 ${accountMsg.ok ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {accountMsg.text}
          </p>
        )}
        <form onSubmit={handleAccountSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-display-name" className="text-sm text-slate-600">
                Display name
              </label>
              <input
                id="profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <input
                value={email}
                readOnly
                disabled
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="text-sm text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Phone
              </label>
              <input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={accountSaving}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            <Save className="w-4 h-4" />
            {accountSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-700" />
          Address
        </h2>
        {addressMsg && (
          <p
            className={`rounded-lg border text-sm px-3 py-2 ${addressMsg.ok ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {addressMsg.text}
          </p>
        )}
        <form onSubmit={handleAddressSave} className="space-y-4">
          <AddressLookup
            value={address}
            parts={addressDetails}
            searchLabel="Search address"
            onChange={({ address: next, addressDetails: details }) => {
              setAddress(next)
              setAddressDetails(details)
            }}
          />
          <p className="text-xs text-slate-400">
            Search fills street, unit, city, and province. Your address is saved in Supabase and
            persists across sessions.
          </p>
          <button
            type="submit"
            disabled={addressSaving}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            <Save className="w-4 h-4" />
            {addressSaving ? 'Saving…' : 'Save address'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-teal-700" />
          Change password
        </h2>
        {passwordMsg && (
          <p
            className={`rounded-lg border text-sm px-3 py-2 ${passwordMsg.ok ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {passwordMsg.text}
          </p>
        )}
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-new-password" className="text-sm text-slate-600">
                New password
              </label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-password" className="text-sm text-slate-600">
                Confirm password
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            At least 6 characters. You&apos;ll need the new password next login.
          </p>
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            <Lock className="w-4 h-4" />
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <CreateHouseholdSection />

      {hasActiveHousehold && household && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            Household details
          </h2>
          <p className="text-slate-600 text-sm">
            Editing <span className="font-medium text-slate-900">{household.name}</span>. Use Profile
            to update household info shown in the sidebar.
          </p>
          {hhMsg && (
            <p
              className={`rounded-lg border text-sm px-3 py-2 ${hhMsg.ok ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-700'}`}
            >
              {hhMsg.text}
            </p>
          )}
          <form onSubmit={handleHouseholdSave} className="space-y-4">
            <div>
              <label htmlFor="hh-name" className="text-sm text-slate-600">
                Household name
              </label>
              <input
                id="hh-name"
                value={hhName}
                onChange={(e) => setHhName(e.target.value)}
                placeholder="e.g. Maple House"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <AddressLookup
              value={hhAddress}
              parts={hhAddressDetails}
              searchLabel="Search household address"
              onChange={({ address: next, addressDetails: details }) => {
                setHhAddress(next)
                setHhAddressDetails(details)
                if (details?.unit) setHhUnit(details.unit)
              }}
            />
            <div>
              <label htmlFor="hh-unit" className="text-sm text-slate-600">
                Unit / room
              </label>
              <input
                id="hh-unit"
                value={hhUnit}
                onChange={(e) => setHhUnit(e.target.value)}
                placeholder="e.g. Unit 2B"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={hhSaving || hhDeleting}
                className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
              >
                <Save className="w-4 h-4" />
                {hhSaving ? 'Saving…' : 'Save household details'}
              </button>
              <button
                type="button"
                disabled={hhSaving || hhDeleting}
                onClick={handleDeleteHousehold}
                className="inline-flex items-center gap-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60 font-medium px-4 py-2 rounded-lg text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {hhDeleting ? 'Deleting…' : 'Delete household'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
