/**
 * Sample data shown on first visit (before anything is saved in localStorage).
 * Gives the professor demo realistic content right away.
 */

export const SAMPLE_MEMBERS = [
  { id: 'm1', householdId: 'h1', name: 'Alex Rivera', email: 'alex@example.com', phone: '555-0101', role: 'tenant' },
  { id: 'm2', householdId: 'h1', name: 'Jordan Lee', email: 'jordan@example.com', phone: '555-0102', role: 'tenant' },
  { id: 'm3', householdId: 'h1', name: 'Sam Patel', email: 'sam@example.com', phone: '555-0103', role: 'leaseholder' },
]

export const SAMPLE_ACCOUNTS = [
  { id: 'u1', memberId: 'm1', householdId: 'h1', name: 'Alex Rivera', email: 'alex@example.com', password: 'Password1!' },
  { id: 'u2', memberId: 'm2', householdId: 'h1', name: 'Jordan Lee', email: 'jordan@example.com', password: 'Password1!' },
  { id: 'u3', memberId: 'm3', householdId: 'h1', name: 'Sam Patel', email: 'sam@example.com', password: 'Password1!' },
]

export const SAMPLE_HOUSEHOLDS = [
  {
    id: 'h1',
    name: 'Sunset Apartments',
    unit: 'Unit 4B',
    address: '1240 Sunset Avenue',
    createdBy: 'm3',
  },
]

export const SAMPLE_EXPENSES = [
  {
    id: 'e1',
    householdId: 'h1',
    title: 'Electric Bill',
    amount: 120,
    date: '2026-05-01',
    splitType: 'equal',
    participants: ['m1', 'm2', 'm3'],
    percentages: {},
    paidBy: ['m1'],
    createdBy: 'm1',
  },
  {
    id: 'e2',
    householdId: 'h1',
    title: 'Internet',
    amount: 80,
    date: '2026-05-10',
    splitType: 'equal',
    participants: ['m1', 'm2', 'm3'],
    percentages: {},
    paidBy: [],
    createdBy: 'm2',
  },
  {
    id: 'e3',
    householdId: 'h1',
    title: 'Groceries',
    amount: 150,
    date: '2026-05-15',
    splitType: 'percentage',
    participants: ['m1', 'm2', 'm3'],
    percentages: { m1: 40, m2: 35, m3: 25 },
    paidBy: ['m2'],
    createdBy: 'm3',
  },
]

export const SAMPLE_MAINTENANCE = [
  {
    id: 'r1',
    householdId: 'h1',
    title: 'Kitchen faucet leak',
    description: 'Slow drip under the sink, started last week.',
    status: 'in_progress',
    date: '2026-05-12',
    submittedBy: 'Alex Rivera',
  },
  {
    id: 'r2',
    householdId: 'h1',
    title: 'Bedroom window stuck',
    description: 'Window will not open for ventilation.',
    status: 'submitted',
    date: '2026-05-18',
    submittedBy: 'Jordan Lee',
  },
]

export const SAMPLE_DOCUMENTS = [
  {
    id: 'd1',
    householdId: 'h1',
    name: 'Lease Agreement 2026.pdf',
    category: 'Lease',
    size: '1.2 MB',
    uploadDate: '2026-01-15',
    content: null,
  },
  {
    id: 'd2',
    householdId: 'h1',
    name: 'Move-In Checklist.pdf',
    category: 'Checklist',
    size: '540 KB',
    uploadDate: '2026-01-20',
    content: null,
  },
]

export const SAMPLE_ACTIVITY = [
  { id: 'a1', householdId: 'h1', text: 'Alex Rivera made a payment for Electric Bill.', at: '2026-05-02' },
  { id: 'a2', householdId: 'h1', text: 'Jordan Lee added an expense: Internet.', at: '2026-05-10' },
  { id: 'a3', householdId: 'h1', text: 'Alex Rivera submitted maintenance: Kitchen faucet leak.', at: '2026-05-12' },
  { id: 'a4', householdId: 'h1', text: 'Sam Patel added an expense: Groceries.', at: '2026-05-15' },
  { id: 'a5', householdId: 'h1', text: 'Jordan Lee submitted maintenance: Bedroom window stuck.', at: '2026-05-18' },
]

export function getInitialState() {
  return {
    currentUserId: null,
    accounts: SAMPLE_ACCOUNTS,
    households: SAMPLE_HOUSEHOLDS,
    members: SAMPLE_MEMBERS,
    expenses: SAMPLE_EXPENSES,
    maintenance: SAMPLE_MAINTENANCE,
    documents: SAMPLE_DOCUMENTS,
    activity: SAMPLE_ACTIVITY,
  }
}