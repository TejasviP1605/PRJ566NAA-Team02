export const SPLIT_MODES = [
  { value: 'equal', label: 'Equal split' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'amount', label: 'Specific amounts' },
]

const ROUND = (value) => Math.round(value * 100) / 100

export function roundMoney(value) {
  return ROUND(Number(value) || 0)
}

/** @typedef {{ memberId: string, amount: number, percentage: number | null }} SplitRow */

export function buildEqualSplits(total, members) {
  const count = members.length
  if (count === 0) return []

  const totalRounded = roundMoney(total)
  const baseShare = roundMoney(totalRounded / count)
  let assigned = 0

  return members.map((member, index) => {
    const isLast = index === count - 1
    const amount = isLast ? roundMoney(totalRounded - assigned) : baseShare
    assigned = roundMoney(assigned + amount)
    return {
      memberId: member.id,
      amount,
      percentage: roundMoney(100 / count),
    }
  })
}

export function amountsFromPercentages(total, members, percentageByMemberId) {
  const totalRounded = roundMoney(total)
  let assigned = 0

  return members.map((member, index) => {
    const isLast = index === members.length - 1
    const pct = roundMoney(percentageByMemberId[member.id] ?? 0)
    const amount = isLast
      ? roundMoney(totalRounded - assigned)
      : roundMoney((totalRounded * pct) / 100)
    assigned = roundMoney(assigned + amount)
    return { memberId: member.id, amount, percentage: pct }
  })
}

export function initPercentageInputs(members) {
  const even = roundMoney(100 / members.length)
  const inputs = {}
  members.forEach((member, index) => {
    inputs[member.id] = index === 0 ? roundMoney(100 - even * (members.length - 1)) : even
  })
  return inputs
}

export function initAmountInputs(total, members) {
  const rows = buildEqualSplits(total, members)
  return Object.fromEntries(rows.map((row) => [row.memberId, row.amount]))
}

export function validateSplitPayload(total, splitMode, splits, members) {
  if (!members.length) return 'Add household members before creating expenses.'
  if (!splits.length || splits.length !== members.length) {
    return 'Enter a split for every household member.'
  }

  const totalRounded = roundMoney(total)
  const amountSum = roundMoney(splits.reduce((sum, row) => sum + row.amount, 0))

  if (Math.abs(amountSum - totalRounded) > 0.02) {
    return `Split amounts must add up to ${totalRounded.toFixed(2)} (currently ${amountSum.toFixed(2)}).`
  }

  if (splitMode === 'percentage') {
    const pctSum = roundMoney(splits.reduce((sum, row) => sum + (row.percentage ?? 0), 0))
    if (Math.abs(pctSum - 100) > 0.05) {
      return `Percentages must add up to 100% (currently ${pctSum.toFixed(1)}%).`
    }
  }

  return null
}

export function splitsFromExpense(expense, members) {
  const existing = expense?.splits ?? []
  if (existing.length > 0) {
    return existing.map((row) => ({
      memberId: row.member_id,
      amount: roundMoney(row.amount),
      percentage: row.percentage != null ? roundMoney(row.percentage) : null,
    }))
  }
  return buildEqualSplits(Number(expense.amount), members)
}

export function splitModeLabel(mode) {
  return SPLIT_MODES.find((item) => item.value === mode)?.label ?? mode
}
