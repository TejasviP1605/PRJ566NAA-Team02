import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { validateSplitPayload } from '../utils/expenseSplits'
import { resolveCurrentMember } from '../utils/splits'

const AppContext = createContext(null)

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]

export const DOCUMENT_CATEGORIES = [
  { value: 'lease', label: 'Lease' },
  { value: 'bill', label: 'Bill' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const DOCUMENT_BUCKET = 'household-documents'
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}

function authErrorMessage(error) {
  const msg = error?.message ?? 'Something went wrong.'
  if (/email not confirmed/i.test(msg)) {
    return 'Email confirmation is required by your Supabase project. Turn off “Confirm email” under Authentication → Providers → Email, then try again.'
  }
  if (/invalid login credentials/i.test(msg)) {
    return 'Invalid email or password.'
  }
  if (/rate limit|too many requests/i.test(msg)) {
    return 'Too many attempts. Wait a few minutes and try again.'
  }
  if (/already registered|already been registered/i.test(msg)) {
    return 'An account already exists for that email.'
  }
  return msg
}

function profileFromAuthUser(user) {
  const displayName =
    user.user_metadata?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'User'
  return {
    displayName,
    email: normalizeEmail(user.email ?? ''),
  }
}

async function ensureProfileRow(user) {
  const { displayName, email } = profileFromAuthUser(user)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, display_name: displayName, email },
      { onConflict: 'id' }
    )
    .select('id, display_name, email, active_household_id')
    .single()

  if (error) throw error
  return data
}

async function replaceExpenseSplits(expenseId, splits) {
  const { error: deleteError } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId)

  if (deleteError) throw deleteError

  if (!splits?.length) return

  const { error: insertError } = await supabase.from('expense_splits').insert(
    splits.map((row) => ({
      expense_id: expenseId,
      member_id: row.memberId,
      amount: row.amount,
      percentage: row.percentage,
      paid: false,
    }))
  )

  if (insertError) throw insertError
}

async function fetchHouseholdData(userId, authUser) {
  let profile = null

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, email, active_household_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw profileError

  if (profileRow) {
    profile = profileRow
  } else if (authUser) {
    profile = await ensureProfileRow(authUser)
  } else {
    throw new Error('Profile not found. Try logging out and back in.')
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from('household_members')
    .select('id, household_id, user_id, name, email, phone, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (membershipError) throw membershipError

  const householdIds = [...new Set((membershipRows ?? []).map((row) => row.household_id))]

  let households = []
  if (householdIds.length > 0) {
    const { data: householdRows, error: householdsError } = await supabase
      .from('households')
      .select('id, name, unit, address')
      .in('id', householdIds)
      .order('name')

    if (householdsError) throw householdsError
    households = householdRows ?? []
  }

  const activeHouseholdId =
    profile.active_household_id && householdIds.includes(profile.active_household_id)
      ? profile.active_household_id
      : householdIds[0] ?? null

  if (activeHouseholdId && activeHouseholdId !== profile.active_household_id) {
    await supabase.from('profiles').update({ active_household_id: activeHouseholdId }).eq('id', userId)
    profile.active_household_id = activeHouseholdId
  }

  const household = households.find((row) => row.id === activeHouseholdId) ?? null

  let members = []
  if (activeHouseholdId) {
    const { data: memberRows, error: membersError } = await supabase
      .from('household_members')
      .select('id, household_id, user_id, name, email, phone, role')
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: true })

    if (membersError) throw membersError
    members = memberRows ?? []
  }

  let expenses = []
  let documents = []
  if (activeHouseholdId) {
    const { data: expenseRows, error: expensesError } = await supabase
      .from('expenses')
      .select(
        `id, household_id, description, amount, category, expense_date,
         paid_by_member_id, split_mode, created_by, created_at,
         splits:expense_splits (id, member_id, amount, percentage, paid, paid_at)`
      )
      .eq('household_id', activeHouseholdId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (expensesError) throw expensesError
    expenses = expenseRows ?? []

    const { data: documentRows, error: documentsError } = await supabase
      .from('documents')
      .select(
        'id, household_id, title, category, file_name, file_path, file_size, mime_type, uploaded_by, created_at'
      )
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false })

    if (documentsError) throw documentsError
    documents = documentRows ?? []
  }

  return { profile, households, household, members, expenses, documents }
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [households, setHouseholds] = useState([])
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [documents, setDocuments] = useState([])

  const userId = session?.user?.id ?? null
  const authUser = session?.user ?? null

  const currentUser = useMemo(() => {
    if (!authUser) return null
    return {
      id: authUser.id,
      name: profile?.display_name ?? authUser.user_metadata?.display_name ?? '',
      email: profile?.email ?? authUser.email ?? '',
    }
  }, [authUser, profile])

  const refreshHouseholdData = useCallback(async (uid, user) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
    }
    const data = await fetchHouseholdData(uid, user)
    setProfile(data.profile)
    setHouseholds(data.households)
    setHousehold(data.household)
    setMembers(data.members)
    setExpenses(data.expenses)
    setDocuments(data.documents)
    setDataError(null)
    return data
  }, [])

  const resolveProfile = useCallback(async () => {
    if (!userId || !authUser) return null
    if (profile) return profile
    const row = await ensureProfileRow(authUser)
    setProfile(row)
    return row
  }, [userId, authUser, profile])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }

    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
      if (!cancelled) setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId || !authUser || !isSupabaseConfigured) {
      setProfile(null)
      setHouseholds([])
      setHousehold(null)
      setMembers([])
      setExpenses([])
      setDocuments([])
      setDataError(null)
      return
    }

    let cancelled = false
    setDataLoading(true)
    setDataError(null)

    refreshHouseholdData(userId, authUser)
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load household data:', err)
          setDataError(err.message || 'Could not load your profile.')
          setProfile(null)
          setHouseholds([])
          setHousehold(null)
          setMembers([])
          setExpenses([])
          setDocuments([])
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, authUser?.id, refreshHouseholdData])

  const activeHouseholdId = profile?.active_household_id ?? household?.id ?? null

  const currentMember = useMemo(
    () => resolveCurrentMember(members, userId, profile?.email ?? authUser?.email),
    [members, userId, profile?.email, authUser?.email]
  )

  const login = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase is not configured. Add credentials to .env.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })

    if (error) return { ok: false, message: authErrorMessage(error) }

    try {
      await ensureProfileRow(data.user)
      await refreshHouseholdData(data.user.id, data.user)
    } catch (err) {
      return { ok: false, message: err.message || 'Signed in but could not load your profile.' }
    }

    return { ok: true }
  }

  const register = async ({ name, email, password }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase is not configured. Add credentials to .env.' }
    }

    const cleanEmail = normalizeEmail(email)
    const displayName = name.trim()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { display_name: displayName } },
    })

    if (error) return { ok: false, message: authErrorMessage(error) }

    if (!data.user) {
      return { ok: false, message: 'Registration failed. Please try again.' }
    }

    if (!data.session) {
      return {
        ok: false,
        message:
          'Account was created but you are not signed in. In Supabase, disable “Confirm email” under Authentication → Providers → Email, then log in.',
      }
    }

    try {
      await ensureProfileRow({ ...data.user, user_metadata: { display_name: displayName } })
      await refreshHouseholdData(data.user.id, data.user)
    } catch (err) {
      return { ok: false, message: err.message || 'Account created but could not load profile.' }
    }

    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setHouseholds([])
    setHousehold(null)
    setMembers([])
    setExpenses([])
    setDocuments([])
    setDataError(null)
  }

  const setActiveHousehold = async (householdId) => {
    if (!userId) return { ok: false, message: 'Please log in first.' }
    if (!households.some((row) => row.id === householdId)) {
      return { ok: false, message: 'You are not a member of that household.' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ active_household_id: householdId })
      .eq('id', userId)

    if (error) return { ok: false, message: error.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const createHousehold = async ({ name, unit, address, phone }) => {
    if (!userId) return { ok: false, message: 'Please log in first.' }

    let activeProfile = profile
    try {
      if (!activeProfile) activeProfile = await resolveProfile()
    } catch (err) {
      return { ok: false, message: err.message || 'Could not load your profile.' }
    }

    if (!activeProfile) {
      return { ok: false, message: 'Could not load your profile. Try logging out and back in.' }
    }

    const newHouseholdId = crypto.randomUUID()
    const memberPhone = phone.trim()
    const memberEmail = activeProfile.email || normalizeEmail(authUser?.email ?? '')

    const { error: householdError } = await supabase.from('households').insert({
      id: newHouseholdId,
      name: name.trim(),
      unit: unit.trim() || 'Primary unit',
      address: address.trim(),
    })

    if (householdError) return { ok: false, message: householdError.message }

    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: newHouseholdId,
      user_id: userId,
      name: activeProfile.display_name,
      email: memberEmail,
      phone: memberPhone,
      role: 'leaseholder',
    })

    if (memberError) return { ok: false, message: memberError.message }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active_household_id: newHouseholdId })
      .eq('id', userId)

    if (profileError) return { ok: false, message: profileError.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const addMember = async ({ name, email, phone }) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    const cleanEmail = normalizeEmail(email)
    const cleanPhone = phone.trim()
    if (!cleanEmail && !cleanPhone) {
      return { ok: false, message: 'Add either a phone number or email address.' }
    }

    const duplicate = members.some(
      (member) =>
        (cleanEmail && member.email?.toLowerCase() === cleanEmail) ||
        (cleanPhone && member.phone === cleanPhone)
    )
    if (duplicate) return { ok: false, message: 'That member is already in this household.' }

    const { error } = await supabase.from('household_members').insert({
      household_id: activeHouseholdId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: 'tenant',
    })

    if (error) return { ok: false, message: error.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const saveExpense = async ({
    expenseId,
    description,
    amount,
    category,
    expenseDate,
    paidByMemberId,
    splitMode,
    splits,
  }) => {
    if (!activeHouseholdId || !userId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    const parsedAmount = Number(amount)
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return { ok: false, message: 'Enter a description and amount greater than zero.' }
    }

    if (!members.some((member) => member.id === paidByMemberId)) {
      return { ok: false, message: 'Choose who paid for this expense.' }
    }

    const splitError = validateSplitPayload(parsedAmount, splitMode, splits, members)
    if (splitError) return { ok: false, message: splitError }

    try {
      if (expenseId) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            description: description.trim(),
            amount: parsedAmount,
            category: category || 'other',
            expense_date: expenseDate || new Date().toISOString().slice(0, 10),
            paid_by_member_id: paidByMemberId,
            split_mode: splitMode,
          })
          .eq('id', expenseId)
          .eq('household_id', activeHouseholdId)

        if (updateError) return { ok: false, message: updateError.message }
        await replaceExpenseSplits(expenseId, splits)
      } else {
        const { data: created, error: insertError } = await supabase
          .from('expenses')
          .insert({
            household_id: activeHouseholdId,
            description: description.trim(),
            amount: parsedAmount,
            category: category || 'other',
            expense_date: expenseDate || new Date().toISOString().slice(0, 10),
            paid_by_member_id: paidByMemberId,
            split_mode: splitMode,
            created_by: userId,
          })
          .select('id')
          .single()

        if (insertError) return { ok: false, message: insertError.message }
        await replaceExpenseSplits(created.id, splits)
      }

      await refreshHouseholdData(userId, authUser)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message || 'Could not save expense.' }
    }
  }

  const addExpense = (payload) => saveExpense(payload)

  const updateExpense = (expenseId, payload) => saveExpense({ ...payload, expenseId })

  const setSplitPaid = async (expenseId, memberId, paid) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'No active household.' }
    }

    const expense = expenses.find((row) => row.id === expenseId)
    if (!expense) return { ok: false, message: 'Expense not found.' }

    const { error } = await supabase
      .from('expense_splits')
      .update({
        paid,
        paid_at: paid ? new Date().toISOString() : null,
      })
      .eq('expense_id', expenseId)
      .eq('member_id', memberId)

    if (error) return { ok: false, message: error.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const markMySharePaid = async (expenseId, paid) => {
    if (!currentMember) {
      return { ok: false, message: 'Could not find your household member profile.' }
    }
    return setSplitPaid(expenseId, currentMember.id, paid)
  }

  const markMemberSharePaid = async (expenseId, memberId, paid) => {
    if (!members.some((member) => member.id === memberId)) {
      return { ok: false, message: 'Member not found in this household.' }
    }
    return setSplitPaid(expenseId, memberId, paid)
  }

  const deleteExpense = async (expenseId) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'No active household.' }
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('household_id', activeHouseholdId)

    if (error) return { ok: false, message: error.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const uploadDocument = async ({ title, category, file }) => {
    if (!activeHouseholdId || !userId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    if (!file) return { ok: false, message: 'Choose a file to upload.' }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return { ok: false, message: 'File must be 10 MB or smaller.' }
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) return { ok: false, message: 'Enter a document title.' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${activeHouseholdId}/${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(filePath, file, { upsert: false, contentType: file.type || undefined })

    if (uploadError) {
      const hint = /bucket/i.test(uploadError.message)
        ? ' Create the “household-documents” storage bucket (run section 6 of schema.sql).'
        : ''
      return { ok: false, message: uploadError.message + hint }
    }

    const { error: insertError } = await supabase.from('documents').insert({
      household_id: activeHouseholdId,
      title: cleanTitle,
      category: category || 'other',
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      uploaded_by: userId,
    })

    if (insertError) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([filePath])
      return { ok: false, message: insertError.message }
    }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const deleteDocument = async (documentId) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'No active household.' }
    }

    const doc = documents.find((row) => row.id === documentId)
    if (!doc) return { ok: false, message: 'Document not found.' }

    const { error: storageError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([doc.file_path])

    if (storageError) return { ok: false, message: storageError.message }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('household_id', activeHouseholdId)

    if (error) return { ok: false, message: error.message }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const getDocumentDownloadUrl = async (filePath) => {
    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(filePath, 3600)

    if (error) throw error
    return data.signedUrl
  }

  const value = {
    loading: !authReady || (Boolean(userId) && dataLoading),
    isConfigured: isSupabaseConfigured,
    dataError,
    currentUser,
    currentMember,
    household,
    households,
    householdId: activeHouseholdId,
    members,
    expenses,
    documents,
    expenseCategories: EXPENSE_CATEGORIES,
    documentCategories: DOCUMENT_CATEGORIES,
    hasHousehold: households.length > 0,
    hasActiveHousehold: Boolean(household),
    isAuthenticated: Boolean(session?.user),
    profileReady: Boolean(profile),
    login,
    register,
    logout,
    setActiveHousehold,
    createHousehold,
    addMember,
    addExpense,
    updateExpense,
    markMySharePaid,
    markMemberSharePaid,
    deleteExpense,
    uploadDocument,
    deleteDocument,
    getDocumentDownloadUrl,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
