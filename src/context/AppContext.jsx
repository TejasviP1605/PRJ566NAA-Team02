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

export const MAINTENANCE_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'structural', label: 'Structural' },
  { value: 'other', label: 'Other' },
]

export const MAINTENANCE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export const MAINTENANCE_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
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

  // Prefer security-definer RPC so RLS cannot hide memberships after login
  let memberships = []
  let usedRpc = false
  let rpcMembershipError = null
  const warnings = []

  // Link any email-matched memberships that are missing user_id
  const { error: linkError } = await supabase.rpc('link_my_memberships')
  if (linkError) {
    console.warn('link_my_memberships unavailable:', linkError.message)
    warnings.push(`link_my_memberships: ${linkError.message}`)
  }

  const { data: rpcMemberships, error: rpcMemErr } = await supabase.rpc('get_my_memberships')
  rpcMembershipError = rpcMemErr

  if (!rpcMembershipError && Array.isArray(rpcMemberships)) {
    memberships = rpcMemberships
    usedRpc = true
  } else {
    if (rpcMembershipError) {
      console.warn('get_my_memberships RPC failed, falling back:', rpcMembershipError.message)
      warnings.push(`get_my_memberships failed: ${rpcMembershipError.message}`)
    }

    const { data: membershipRows, error: membershipError } = await supabase
      .from('household_members')
      .select('id, household_id, user_id, name, email, phone, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (membershipError) {
      warnings.push(`membership query failed: ${membershipError.message}`)
      throw membershipError
    }
    memberships = membershipRows ?? []

    if (memberships.length === 0 && profile.email) {
      const { data: emailMemberships, error: emailMembershipError } = await supabase
        .from('household_members')
        .select('id, household_id, user_id, name, email, phone, role')
        .ilike('email', profile.email)
        .order('created_at', { ascending: true })

      if (!emailMembershipError && emailMemberships?.length) {
        memberships = emailMemberships
        const unlinked = emailMemberships.filter((row) => row.user_id !== userId)
        if (unlinked.length) {
          await Promise.all(
            unlinked.map((row) =>
              supabase
                .from('household_members')
                .update({ user_id: userId })
                .eq('id', row.id)
            )
          )
        }
      } else if (emailMembershipError) {
        warnings.push(`email membership query failed: ${emailMembershipError.message}`)
      }
    }
  }

  const householdIds = [...new Set(memberships.map((row) => row.household_id).filter(Boolean))]

  console.info('[RentRight] memberships loaded', {
    userId,
    email: profile.email,
    membershipCount: memberships.length,
    householdIds,
    usedRpc,
    rpcError: rpcMembershipError?.message ?? null,
  })

  let households = []
  if (householdIds.length > 0) {
    const { data: rpcHouseholds, error: rpcHouseholdsError } = await supabase.rpc('get_my_households')

    if (!rpcHouseholdsError && Array.isArray(rpcHouseholds) && rpcHouseholds.length > 0) {
      households = rpcHouseholds
    } else {
      if (rpcHouseholdsError) {
        warnings.push(`get_my_households failed: ${rpcHouseholdsError.message}`)
      }

      const { data: householdRows, error: householdsError } = await supabase
        .from('households')
        .select('id, name, unit, address')
        .in('id', householdIds)
        .order('name')

      if (householdsError) {
        warnings.push(`households query failed: ${householdsError.message}`)
        // Last resort: synthesize from membership household ids with placeholder names
        households = householdIds.map((id) => ({
          id,
          name: 'Household',
          unit: '',
          address: '',
        }))
      } else {
        households = householdRows ?? []
      }
    }
  }

  console.info('[RentRight] households loaded', {
    householdCount: households.length,
    names: households.map((h) => h.name),
  })

  if (householdIds.length > 0 && households.length === 0) {
    warnings.push(
      'Memberships were found but households could not be loaded. Re-run supabase/schema.sql in the Supabase SQL Editor.'
    )
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
  let maintenanceRequests = []
  let activities = []

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

    if (expensesError) {
      console.error('Expenses load failed:', expensesError.message)
      warnings.push(`Expenses could not load: ${expensesError.message}`)
    } else {
      expenses = expenseRows ?? []
    }

    const { data: documentRows, error: documentsError } = await supabase
      .from('documents')
      .select(
        'id, household_id, title, category, file_name, file_path, file_size, mime_type, uploaded_by, created_at'
      )
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('Documents load failed:', documentsError.message)
      warnings.push(`Documents could not load: ${documentsError.message}`)
    } else {
      documents = documentRows ?? []
    }

    const { data: maintenanceRows, error: maintenanceError } = await supabase
      .from('maintenance_requests')
      .select(
        `id, household_id, title, description, category, priority, status,
         submitted_by, submitted_by_member_id, created_at, updated_at`
      )
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false })

    if (maintenanceError) {
      console.error('Maintenance load failed:', maintenanceError.message)
      warnings.push(
        'Maintenance table missing or blocked. Run the maintenance section of supabase/schema.sql in the Supabase SQL Editor.'
      )
    } else {
      maintenanceRequests = maintenanceRows ?? []
    }

    const { data: activityRows, error: activitiesError } = await supabase
      .from('activities')
      .select(
        `id, household_id, actor_user_id, actor_member_id, activity_type,
         description, related_entity_type, related_entity_id, created_at`
      )
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (activitiesError) {
      console.error('Activity load failed:', activitiesError.message)
      warnings.push(
        'Activities table missing or blocked. Run the activities section of supabase/schema.sql in the Supabase SQL Editor.'
      )
    } else {
      activities = activityRows ?? []
    }
  }

  return {
    profile,
    households,
    household,
    members,
    expenses,
    documents,
    maintenanceRequests,
    activities,
    warnings,
  }
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
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [activities, setActivities] = useState([])

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
    setMaintenanceRequests(data.maintenanceRequests)
    setActivities(data.activities)
    setDataError(data.warnings?.length ? data.warnings.join(' ') : null)
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
      setMaintenanceRequests([])
      setActivities([])
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
          // Keep any already-loaded profile/households; do not wipe on reload errors.
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
    setMaintenanceRequests([])
    setActivities([])
    setDataError(null)
  }

  const logActivity = async ({
    householdId,
    activityType,
    description,
    relatedEntityType = '',
    relatedEntityId = null,
    actorMemberId = null,
  }) => {
    const targetHouseholdId = householdId ?? activeHouseholdId
    if (!targetHouseholdId || !userId || !description?.trim()) return

    const { error } = await supabase.from('activities').insert({
      household_id: targetHouseholdId,
      actor_user_id: userId,
      actor_member_id: actorMemberId ?? currentMember?.id ?? null,
      activity_type: activityType,
      description: description.trim(),
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    })

    if (error) {
      console.error('Failed to log activity:', error.message)
    }
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

    try {
      let activeProfile = profile
      if (!activeProfile) activeProfile = await resolveProfile()
      if (!activeProfile && authUser) activeProfile = await ensureProfileRow(authUser)

      if (!activeProfile) {
        return { ok: false, message: 'Could not load your profile. Try logging out and back in.' }
      }

      const newHouseholdId = crypto.randomUUID()
      const memberPhone = (phone ?? '').trim()
      const memberEmail = activeProfile.email || normalizeEmail(authUser?.email ?? '')

      if (!memberEmail && !memberPhone) {
        return {
          ok: false,
          message: 'Add a phone number, or make sure your account email is set, then try again.',
        }
      }

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

      await logActivity({
        householdId: newHouseholdId,
        activityType: 'household_created',
        description: `${activeProfile.display_name} created household “${name.trim()}”`,
        relatedEntityType: 'household',
        relatedEntityId: newHouseholdId,
      })

      await refreshHouseholdData(userId, authUser)
      return { ok: true }
    } catch (err) {
      console.error('createHousehold failed:', err)
      return { ok: false, message: err.message || 'Could not create household.' }
    }
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

    const { data: createdMember, error } = await supabase
      .from('household_members')
      .insert({
        household_id: activeHouseholdId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: 'tenant',
      })
      .select('id')
      .single()

    if (error) return { ok: false, message: error.message }

    await logActivity({
      activityType: 'member_added',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} added member “${name.trim()}”`,
      relatedEntityType: 'member',
      relatedEntityId: createdMember?.id ?? null,
    })

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
        await logActivity({
          activityType: 'expense_updated',
          description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} updated expense “${description.trim()}”`,
          relatedEntityType: 'expense',
          relatedEntityId: expenseId,
        })
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
        await logActivity({
          activityType: 'expense_added',
          description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} added expense “${description.trim()}” ($${parsedAmount.toFixed(2)})`,
          relatedEntityType: 'expense',
          relatedEntityId: created.id,
        })
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

    const actorName = currentMember?.name ?? currentUser?.name ?? 'Someone'
    await logActivity({
      activityType: 'expense_deleted',
      description: `${actorName} deleted an expense`,
      relatedEntityType: 'expense',
      relatedEntityId: expenseId,
    })

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
        ? ' Create the “household-documents” storage bucket (run section 7 of supabase/schema.sql).'
        : ''
      return { ok: false, message: uploadError.message + hint }
    }

    const { data: createdDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        household_id: activeHouseholdId,
        title: cleanTitle,
        category: category || 'other',
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        uploaded_by: userId,
      })
      .select('id')
      .single()

    if (insertError) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([filePath])
      return { ok: false, message: insertError.message }
    }

    await logActivity({
      activityType: 'document_uploaded',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} uploaded document “${cleanTitle}”`,
      relatedEntityType: 'document',
      relatedEntityId: createdDoc?.id ?? null,
    })

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

    await logActivity({
      activityType: 'document_deleted',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} deleted document “${doc.title}”`,
      relatedEntityType: 'document',
      relatedEntityId: documentId,
    })

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

  const saveMaintenanceRequest = async ({
    requestId,
    title,
    description,
    category,
    priority,
  }) => {
    if (!activeHouseholdId || !userId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) return { ok: false, message: 'Enter a title for the request.' }

    try {
      if (requestId) {
        const existing = maintenanceRequests.find((row) => row.id === requestId)
        if (!existing) return { ok: false, message: 'Request not found.' }
        if (existing.status !== 'submitted') {
          return { ok: false, message: 'Only submitted requests can be edited.' }
        }

        const { error } = await supabase
          .from('maintenance_requests')
          .update({
            title: cleanTitle,
            description: description.trim(),
            category: category || 'other',
            priority: priority || 'medium',
          })
          .eq('id', requestId)
          .eq('household_id', activeHouseholdId)

        if (error) return { ok: false, message: error.message }

        await logActivity({
          activityType: 'maintenance_updated',
          description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} updated maintenance request “${cleanTitle}”`,
          relatedEntityType: 'maintenance',
          relatedEntityId: requestId,
        })
      } else {
        const { data: created, error } = await supabase
          .from('maintenance_requests')
          .insert({
            household_id: activeHouseholdId,
            title: cleanTitle,
            description: description.trim(),
            category: category || 'other',
            priority: priority || 'medium',
            status: 'submitted',
            submitted_by: userId,
            submitted_by_member_id: currentMember?.id ?? null,
          })
          .select('id')
          .single()

        if (error) return { ok: false, message: error.message }

        await logActivity({
          activityType: 'maintenance_created',
          description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} submitted maintenance request “${cleanTitle}”`,
          relatedEntityType: 'maintenance',
          relatedEntityId: created.id,
        })
      }

      await refreshHouseholdData(userId, authUser)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message || 'Could not save maintenance request.' }
    }
  }

  const addMaintenanceRequest = (payload) => saveMaintenanceRequest(payload)

  const updateMaintenanceRequest = (requestId, payload) =>
    saveMaintenanceRequest({ ...payload, requestId })

  const updateMaintenanceStatus = async (requestId, status) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'No active household.' }
    }

    const allowed = MAINTENANCE_STATUSES.map((item) => item.value)
    if (!allowed.includes(status)) {
      return { ok: false, message: 'Invalid status.' }
    }

    const existing = maintenanceRequests.find((row) => row.id === requestId)
    if (!existing) return { ok: false, message: 'Request not found.' }

    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('household_id', activeHouseholdId)

    if (error) return { ok: false, message: error.message }

    const statusLabel = MAINTENANCE_STATUSES.find((item) => item.value === status)?.label ?? status
    await logActivity({
      activityType: 'maintenance_status_changed',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} marked “${existing.title}” as ${statusLabel}`,
      relatedEntityType: 'maintenance',
      relatedEntityId: requestId,
    })

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const cancelMaintenanceRequest = async (requestId) => {
    const existing = maintenanceRequests.find((row) => row.id === requestId)
    if (!existing) return { ok: false, message: 'Request not found.' }
    if (existing.status !== 'submitted') {
      return { ok: false, message: 'Only submitted requests can be cancelled.' }
    }
    return updateMaintenanceStatus(requestId, 'cancelled')
  }

  const updateProfile = async ({ displayName, phone, address, addressDetails }) => {
    if (!userId) return { ok: false, message: 'Please log in first.' }

    const updates = {}
    if (displayName !== undefined) updates.display_name = displayName.trim()
    if (phone !== undefined) updates.phone = phone.trim()
    if (address !== undefined) updates.address = address.trim()
    if (addressDetails !== undefined) updates.address_details = addressDetails

    if (!Object.keys(updates).length) return { ok: true }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) return { ok: false, message: error.message }

    if (activeHouseholdId) {
      await logActivity({
        activityType: 'profile_updated',
        description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} updated their profile`,
        relatedEntityType: 'profile',
        relatedEntityId: userId,
      })
    }

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  const updateHousehold = async ({ name, unit, address }) => {
    if (!activeHouseholdId) return { ok: false, message: 'No active household.' }

    const { error } = await supabase
      .from('households')
      .update({
        name: name.trim(),
        unit: unit.trim() || 'Primary unit',
        address: address.trim(),
      })
      .eq('id', activeHouseholdId)

    if (error) return { ok: false, message: error.message }

    await logActivity({
      activityType: 'household_updated',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} updated household details`,
      relatedEntityType: 'household',
      relatedEntityId: activeHouseholdId,
    })

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const deleteHousehold = async () => {
    if (!activeHouseholdId || !household) {
      return { ok: false, message: 'No household to delete.' }
    }

    const deletedId = activeHouseholdId
    const deletedName = household.name

    const { error } = await supabase.from('households').delete().eq('id', deletedId)
    if (error) return { ok: false, message: error.message }

    const remaining = households.filter((item) => item.id !== deletedId)
    const nextId = remaining[0]?.id ?? null

    await supabase.from('profiles').update({ active_household_id: nextId }).eq('id', userId)
    await refreshHouseholdData(userId, authUser)
    return { ok: true, message: `Deleted household “${deletedName}”.` }
  }

  const updateMember = async (memberId, { name, email, phone }) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    const existing = members.find((member) => member.id === memberId)
    if (!existing) return { ok: false, message: 'Member not found.' }

    const cleanEmail = normalizeEmail(email)
    const cleanPhone = phone.trim()
    if (!cleanEmail && !cleanPhone) {
      return { ok: false, message: 'Add either a phone number or email address.' }
    }

    const { error } = await supabase
      .from('household_members')
      .update({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      })
      .eq('id', memberId)

    if (error) return { ok: false, message: error.message }

    await logActivity({
      activityType: 'member_updated',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} updated member “${name.trim()}”`,
      relatedEntityType: 'member',
      relatedEntityId: memberId,
    })

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
  }

  const deleteMember = async (memberId) => {
    if (!activeHouseholdId) {
      return { ok: false, message: 'Create or select a household first.' }
    }

    const existing = members.find((member) => member.id === memberId)
    if (!existing) return { ok: false, message: 'Member not found.' }

    if (members.length <= 1) {
      return { ok: false, message: 'Cannot remove the last member. Delete the household instead.' }
    }

    const { data, error } = await supabase.rpc('remove_household_member', {
      p_member_id: memberId,
    })

    if (error) return { ok: false, message: error.message }
    if (!data?.ok) return { ok: false, message: data?.message || 'Member was not deleted.' }

    await logActivity({
      activityType: 'member_removed',
      description: `${currentMember?.name ?? currentUser?.name ?? 'Someone'} removed member “${existing.name}”`,
      relatedEntityType: 'member',
      relatedEntityId: memberId,
    })

    await refreshHouseholdData(userId, authUser)
    return { ok: true }
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
    maintenanceRequests,
    activities,
    expenseCategories: EXPENSE_CATEGORIES,
    documentCategories: DOCUMENT_CATEGORIES,
    maintenanceCategories: MAINTENANCE_CATEGORIES,
    maintenancePriorities: MAINTENANCE_PRIORITIES,
    maintenanceStatuses: MAINTENANCE_STATUSES,
    hasHousehold: households.length > 0,
    hasActiveHousehold: Boolean(household),
    isAuthenticated: Boolean(session?.user),
    profileReady: Boolean(profile),
    profile,
    login,
    register,
    logout,
    setActiveHousehold,
    createHousehold,
    addMember,
    updateMember,
    deleteMember,
    updateProfile,
    changePassword,
    updateHousehold,
    deleteHousehold,
    addExpense,
    updateExpense,
    markMySharePaid,
    markMemberSharePaid,
    deleteExpense,
    uploadDocument,
    deleteDocument,
    getDocumentDownloadUrl,
    addMaintenanceRequest,
    updateMaintenanceRequest,
    updateMaintenanceStatus,
    cancelMaintenanceRequest,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
