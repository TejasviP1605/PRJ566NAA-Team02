import { roundMoney } from './expenseSplits'

function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}

/** Match logged-in user to their household_members row. */
export function resolveCurrentMember(members, userId, profileEmail) {
  if (!members?.length) return null

  const byUserId = members.find((member) => member.user_id === userId)
  if (byUserId) return byUserId

  const email = normalizeEmail(profileEmail)
  if (email) {
    return members.find((member) => normalizeEmail(member.email) === email) ?? null
  }

  return null
}

export function getMySplit(expense, currentMemberId, memberCount) {
  const splits = expense.splits ?? []
  const row = splits.find((split) => split.member_id === currentMemberId)
  if (row) {
    return {
      amount: roundMoney(row.amount),
      paid: Boolean(row.paid),
      splitId: row.id ?? null,
    }
  }

  if (memberCount > 0) {
    return {
      amount: roundMoney(Number(expense.amount) / memberCount),
      paid: false,
      splitId: null,
    }
  }

  return { amount: 0, paid: false, splitId: null }
}

/** Total you are responsible for across all expenses (paid or not). */
export function computeYourShare(expenses, currentMemberId, memberCount = 0) {
  if (!currentMemberId) return 0

  return (expenses ?? []).reduce(
    (total, expense) => total + getMySplit(expense, currentMemberId, memberCount).amount,
    0
  )
}

/**
 * Unpaid portion of your share. Marking paid reduces this only — not your share.
 */
export function computeYouOwe(expenses, currentMemberId, memberCount = 0) {
  if (!currentMemberId) return 0

  return (expenses ?? []).reduce((total, expense) => {
    const mine = getMySplit(expense, currentMemberId, memberCount)
    if (mine.paid) return total
    return total + mine.amount
  }, 0)
}

/** On expenses you paid, how much others still owe you (unpaid splits). */
export function computeOwedToYou(expenses, currentMemberId) {
  if (!currentMemberId) return 0

  return (expenses ?? []).reduce((total, expense) => {
    if (expense.paid_by_member_id !== currentMemberId) return total

    const othersUnpaid = (expense.splits ?? [])
      .filter((split) => split.member_id !== currentMemberId && !split.paid)
      .reduce((sum, split) => sum + roundMoney(split.amount), 0)

    return total + othersUnpaid
  }, 0)
}

export function computeHouseholdTotal(expenses) {
  return (expenses ?? []).reduce((total, expense) => total + Number(expense.amount), 0)
}

export function youOweSubtitle(expenses, currentMemberId, memberCount = 0) {
  if (!currentMemberId) {
    return 'Link your account to a household member to track balances.'
  }

  if (!expenses?.length) {
    return 'Unpaid part of your share — mark paid on each expense'
  }

  const youOwe = computeYouOwe(expenses, currentMemberId, memberCount)
  if (youOwe <= 0) {
    return 'All your shares are marked paid'
  }

  return 'Unpaid part of your share — mark paid on each expense'
}

export function owedToYouSubtitle(expenses, currentMemberId) {
  if (!currentMemberId) return ''

  const owed = computeOwedToYou(expenses, currentMemberId)
  if (owed <= 0) {
    return 'Everyone has paid you back for bills you covered'
  }

  return 'From expenses you paid — mark members paid below'
}
