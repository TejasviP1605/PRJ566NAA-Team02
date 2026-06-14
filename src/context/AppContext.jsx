import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getInitialState } from '../data/sampleData'

const STORAGE_KEY = 'rentright-app-data'
const DEFAULT_HOUSEHOLD_ID = 'h1'

const AppContext = createContext(null)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function makeId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}

function legacyHouseholdIdForMember(member) {
  // Older demo data stored everyone in one implicit household. Keep only the
  // original seeded members there; newly registered legacy users should remain
  // household-less until they create or join one.
  return ['m1', 'm2', 'm3'].includes(member.id) ? DEFAULT_HOUSEHOLD_ID : null
}

function normalizeState(saved) {
  const fresh = getInitialState()
  if (!saved || typeof saved !== 'object') return fresh

  const legacyHousehold = saved.household
    ? [{ id: DEFAULT_HOUSEHOLD_ID, ...saved.household }]
    : []
  const households = saved.households?.length ? saved.households : legacyHousehold.length ? legacyHousehold : fresh.households

  const members = (saved.members?.length ? saved.members : fresh.members).map((member) => ({
    ...member,
    householdId: member.householdId ?? legacyHouseholdIdForMember(member),
    email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: member.phone || '',
  }))

  const accounts = (saved.accounts?.length ? saved.accounts : fresh.accounts).map((account) => {
    const linkedMember = members.find((member) => member.id === account.memberId)
    return {
      ...account,
      householdId: account.householdId ?? linkedMember?.householdId ?? null,
    }
  })

  return {
    ...fresh,
    ...saved,
    currentUserId: saved.currentUserId ?? null,
    households,
    accounts,
    members,
    expenses: (saved.expenses || fresh.expenses).map((expense) => ({
      ...expense,
      householdId: expense.householdId || DEFAULT_HOUSEHOLD_ID,
      participants: expense.participants?.length
        ? expense.participants
        : members
            .filter((member) => (expense.householdId || DEFAULT_HOUSEHOLD_ID) === member.householdId)
            .map((member) => member.id),
    })),
    maintenance: (saved.maintenance || fresh.maintenance).map((request) => ({
      ...request,
      householdId: request.householdId || DEFAULT_HOUSEHOLD_ID,
    })),
    documents: (saved.documents || fresh.documents).map((doc) => ({
      ...doc,
      householdId: doc.householdId || DEFAULT_HOUSEHOLD_ID,
    })),
    activity: (saved.activity?.length ? saved.activity : fresh.activity).map((item) => ({
      ...item,
      householdId: item.householdId || DEFAULT_HOUSEHOLD_ID,
    })),
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeState(JSON.parse(raw))
  } catch {
    // If storage is corrupted, fall back to fresh sample data.
  }
  return getInitialState()
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const currentUser = useMemo(
    () => state.accounts.find((account) => account.id === state.currentUserId) || null,
    [state.accounts, state.currentUserId]
  )

  const householdId = currentUser?.householdId || null
  const household = useMemo(
    () => state.households.find((item) => item.id === householdId) || null,
    [state.households, householdId]
  )

  const currentMember = useMemo(
    () => state.members.find((member) => member.id === currentUser?.memberId) || null,
    [state.members, currentUser]
  )

  const householdMembers = useMemo(
    () => state.members.filter((member) => member.householdId === householdId),
    [state.members, householdId]
  )

  const householdExpenses = useMemo(
    () => state.expenses.filter((expense) => expense.householdId === householdId),
    [state.expenses, householdId]
  )

  const householdMaintenance = useMemo(
    () => state.maintenance.filter((request) => request.householdId === householdId),
    [state.maintenance, householdId]
  )

  const householdDocuments = useMemo(
    () => state.documents.filter((doc) => doc.householdId === householdId),
    [state.documents, householdId]
  )

  const householdActivity = useMemo(
    () => state.activity.filter((item) => item.householdId === householdId),
    [state.activity, householdId]
  )

  const addActivity = (draft, text, targetHouseholdId = householdId) => ({
    ...draft,
    activity: targetHouseholdId
      ? [{ id: makeId('a'), householdId: targetHouseholdId, text, at: today() }, ...(draft.activity || [])].slice(0, 50)
      : draft.activity || [],
  })

  const login = ({ email, password }) => {
    const account = state.accounts.find(
      (item) => item.email === normalizeEmail(email) && item.password === password
    )

    if (!account) {
      return { ok: false, message: 'Invalid email or password.' }
    }

    setState((s) => ({ ...s, currentUserId: account.id }))
    return { ok: true }
  }

  const register = ({ name, email, password }) => {
    const cleanEmail = normalizeEmail(email)
    if (state.accounts.some((account) => account.email === cleanEmail)) {
      return { ok: false, message: 'An account already exists for that email.' }
    }

    const accountId = makeId('u')
    const displayName = name.trim()

    setState((s) => ({
      ...s,
      currentUserId: accountId,
      accounts: [
        ...s.accounts,
        {
          id: accountId,
          memberId: null,
          householdId: null,
          name: displayName,
          email: cleanEmail,
          password,
        },
      ],
    }))

    return { ok: true }
  }

  const logout = () => setState((s) => ({ ...s, currentUserId: null }))

  const createHousehold = ({ name, unit, address, phone }) => {
    if (!currentUser) return { ok: false, message: 'Please log in first.' }
    if (currentUser.householdId) {
      return { ok: false, message: 'You are already in a household.' }
    }

    const newHouseholdId = makeId('h')
    const memberId = makeId('m')
    const displayName = currentUser.name

    setState((s) => {
      const next = {
        ...s,
        households: [
          ...s.households,
          {
            id: newHouseholdId,
            name: name.trim(),
            unit: unit.trim() || 'Primary unit',
            address: address.trim(),
            createdBy: memberId,
          },
        ],
        members: [
          ...s.members,
          {
            id: memberId,
            householdId: newHouseholdId,
            name: displayName,
            email: currentUser.email,
            phone: phone.trim(),
            role: 'leaseholder',
          },
        ],
        accounts: s.accounts.map((account) =>
          account.id === currentUser.id
            ? { ...account, householdId: newHouseholdId, memberId }
            : account
        ),
      }
      return addActivity(next, `${displayName} created the household.`, newHouseholdId)
    })

    return { ok: true }
  }

  const addMember = ({ name, email, phone }) => {
    if (!householdId) return { ok: false, message: 'Create a household first.' }
    const cleanEmail = normalizeEmail(email)
    const cleanPhone = phone.trim()
    if (!cleanEmail && !cleanPhone) {
      return { ok: false, message: 'Add either a phone number or email address.' }
    }

    const existingMember = state.members.find(
      (member) => member.householdId === householdId && (
        (cleanEmail && member.email === cleanEmail) || (cleanPhone && member.phone === cleanPhone)
      )
    )
    if (existingMember) return { ok: false, message: 'That member is already in this household.' }

    const existingAccount = cleanEmail
      ? state.accounts.find((account) => account.email === cleanEmail)
      : null
    if (existingAccount?.householdId) {
      return { ok: false, message: 'That user already belongs to another household.' }
    }

    const memberId = makeId('m')
    const displayName = name.trim()

    setState((s) => {
      const next = {
        ...s,
        members: [
          ...s.members,
          {
            id: memberId,
            householdId,
            name: displayName,
            email: cleanEmail,
            phone: cleanPhone,
            role: 'tenant',
          },
        ],
        accounts: existingAccount
          ? s.accounts.map((account) =>
              account.id === existingAccount.id
                ? { ...account, householdId, memberId, name: displayName }
                : account
            )
          : s.accounts,
      }
      return addActivity(next, `${currentMember?.name || 'A household member'} added ${displayName} to the household.`)
    })

    return { ok: true }
  }

  const addExpense = (expense) =>
    setState((s) => {
      const actor = currentMember?.name || 'A household member'
      const participants = expense.participants?.length
        ? expense.participants
        : householdMembers.map((member) => member.id)
      const next = {
        ...s,
        expenses: [
          {
            ...expense,
            id: makeId('e'),
            householdId,
            participants,
            paidBy: [],
            createdBy: currentMember?.id,
          },
          ...s.expenses,
        ],
      }
      return addActivity(next, `${actor} added an expense: ${expense.title}.`)
    })

  const updateExpense = (expenseId, updates) =>
    setState((s) => {
      const existing = s.expenses.find((expense) => expense.id === expenseId)
      const actor = currentMember?.name || 'A household member'
      const participants = updates.participants?.length ? updates.participants : existing?.participants
      const next = {
        ...s,
        expenses: s.expenses.map((expense) =>
          expense.id === expenseId
            ? {
                ...expense,
                ...updates,
                participants,
                paidBy: (expense.paidBy || []).filter((memberId) =>
                  (participants || []).includes(memberId)
                ),
              }
            : expense
        ),
      }
      return addActivity(next, `${actor} edited expense: ${existing?.title || updates.title}.`)
    })

  const deleteExpense = (expenseId) =>
    setState((s) => {
      const removed = s.expenses.find((expense) => expense.id === expenseId)
      const actor = currentMember?.name || 'A household member'
      const next = { ...s, expenses: s.expenses.filter((expense) => expense.id !== expenseId) }
      return addActivity(next, `${actor} deleted expense: ${removed?.title || 'expense'}.`)
    })

  const markExpensePaid = (expenseId, memberId) =>
    setState((s) => {
      const expense = s.expenses.find((item) => item.id === expenseId)
      const member = s.members.find((item) => item.id === memberId)
      const next = {
        ...s,
        expenses: s.expenses.map((item) =>
          item.id === expenseId && !item.paidBy?.includes(memberId)
            ? { ...item, paidBy: [...(item.paidBy || []), memberId] }
            : item
        ),
      }
      return addActivity(next, `${member?.name || 'A household member'} made a payment for ${expense?.title || 'an expense'}.`)
    })

  const addMaintenance = (request) =>
    setState((s) => {
      const actor = currentMember?.name || request.submittedBy || 'A household member'
      const next = {
        ...s,
        maintenance: [
          {
            ...request,
            id: makeId('r'),
            householdId,
            status: 'submitted',
            date: request.date || today(),
            submittedBy: actor,
          },
          ...s.maintenance,
        ],
      }
      return addActivity(next, `${actor} submitted maintenance: ${request.title}.`)
    })

  const updateMaintenance = (id, updates) =>
    setState((s) => {
      const existing = s.maintenance.find((request) => request.id === id)
      const actor = currentMember?.name || 'A household member'
      const next = {
        ...s,
        maintenance: s.maintenance.map((request) =>
          request.id === id ? { ...request, ...updates } : request
        ),
      }
      const action = updates.status && updates.status !== existing?.status ? 'updated' : 'edited'
      return addActivity(next, `${actor} ${action} maintenance: ${existing?.title || updates.title}.`)
    })

  const updateMaintenanceStatus = (id, status) => updateMaintenance(id, { status })

  const deleteMaintenance = (id) =>
    setState((s) => {
      const removed = s.maintenance.find((request) => request.id === id)
      const actor = currentMember?.name || 'A household member'
      const next = { ...s, maintenance: s.maintenance.filter((request) => request.id !== id) }
      return addActivity(next, `${actor} deleted maintenance: ${removed?.title || 'request'}.`)
    })

  const addDocument = (doc) =>
    setState((s) => {
      const actor = currentMember?.name || 'A household member'
      const next = {
        ...s,
        documents: [{ ...doc, id: makeId('d'), householdId, uploadedBy: actor }, ...s.documents],
      }
      return addActivity(next, `${actor} uploaded document: ${doc.name}.`)
    })

  const updateDocument = (id, updates) =>
    setState((s) => {
      const existing = s.documents.find((doc) => doc.id === id)
      const actor = currentMember?.name || 'A household member'
      const next = {
        ...s,
        documents: s.documents.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc)),
      }
      return addActivity(next, `${actor} edited document: ${existing?.name || updates.name}.`)
    })

  const deleteDocument = (id) =>
    setState((s) => {
      const removed = s.documents.find((doc) => doc.id === id)
      const actor = currentMember?.name || 'A household member'
      const next = { ...s, documents: s.documents.filter((doc) => doc.id !== id) }
      return addActivity(next, `${actor} deleted document: ${removed?.name || 'document'}.`)
    })

  const resetDemo = () => {
    const fresh = getInitialState()
    setState(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  }

  const value = {
    ...state,
    currentUser,
    currentMember,
    household,
    householdId,
    members: householdMembers,
    expenses: householdExpenses,
    maintenance: householdMaintenance,
    documents: householdDocuments,
    activity: householdActivity,
    hasHousehold: Boolean(householdId && household),
    isAuthenticated: Boolean(currentUser),
    login,
    register,
    logout,
    createHousehold,
    addMember,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpensePaid,
    addMaintenance,
    updateMaintenance,
    updateMaintenanceStatus,
    deleteMaintenance,
    addDocument,
    updateDocument,
    deleteDocument,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}