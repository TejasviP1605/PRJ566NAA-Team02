/**
 * Split math for shared expenses.
 * Equal: divide total evenly among all household members.
 * Percentage: each member pays their assigned % (must sum to 100).
 */

export function getExpenseParticipants(expense, members) {
  const participantIds = expense.participants?.length
    ? expense.participants
    : members.map((m) => m.id)

  return members.filter((member) => participantIds.includes(member.id))
}

export function getMemberShare(expense, memberId, members) {
  const participants = getExpenseParticipants(expense, members)
  const count = participants.length
  if (!count) return 0

  if (!participants.some((member) => member.id === memberId)) return 0

  if (expense.splitType === 'percentage') {
    const pct = expense.percentages?.[memberId] ?? 0
    return (expense.amount * pct) / 100
  }

  return expense.amount / count
}

export function getSplitBreakdown(expense, members) {
  return getExpenseParticipants(expense, members).map((member) => ({
    member,
    share: getMemberShare(expense, member.id, members),
    isPaid: expense.paidBy?.includes(member.id) ?? false,
  }))
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
