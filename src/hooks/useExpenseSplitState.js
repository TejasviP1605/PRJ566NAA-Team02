import { useCallback, useMemo, useState } from 'react'
import {
  amountsFromPercentages,
  buildEqualSplits,
  initAmountInputs,
  initPercentageInputs,
  roundMoney,
  splitsFromExpense,
} from '../utils/expenseSplits'

export function useExpenseSplitState(members, totalAmount, initialExpense = null) {
  const total = roundMoney(totalAmount)
  const initialMode = initialExpense?.split_mode ?? 'equal'
  const initialRows = initialExpense
    ? splitsFromExpense(initialExpense, members)
    : buildEqualSplits(total, members)

  const [splitMode, setSplitMode] = useState(initialMode)
  const [percentInputs, setPercentInputs] = useState(() => {
    if (initialMode === 'percentage' && initialRows.length) {
      return Object.fromEntries(initialRows.map((row) => [row.memberId, row.percentage ?? 0]))
    }
    return members.length ? initPercentageInputs(members) : {}
  })
  const [amountInputs, setAmountInputs] = useState(() => {
    if (initialMode === 'amount' && initialRows.length) {
      return Object.fromEntries(initialRows.map((row) => [row.memberId, row.amount]))
    }
    return total > 0 && members.length ? initAmountInputs(total, members) : {}
  })

  const splits = useMemo(() => {
    if (!members.length || total <= 0) return []

    if (splitMode === 'equal') {
      return buildEqualSplits(total, members)
    }

    if (splitMode === 'percentage') {
      const inputs =
        Object.keys(percentInputs).length > 0
          ? percentInputs
          : initPercentageInputs(members)
      return amountsFromPercentages(total, members, inputs)
    }

    const inputs =
      Object.keys(amountInputs).length > 0 ? amountInputs : initAmountInputs(total, members)
    return members.map((member) => {
      const amount = roundMoney(amountInputs[member.id] ?? inputs[member.id] ?? 0)
      return {
        memberId: member.id,
        amount,
        percentage: total > 0 ? roundMoney((amount / total) * 100) : 0,
      }
    })
  }, [splitMode, members, total, percentInputs, amountInputs])

  const setMode = useCallback(
    (mode) => {
      setSplitMode(mode)
      if (mode === 'equal') {
        setPercentInputs({})
        setAmountInputs({})
        return
      }
      if (mode === 'percentage') {
        setPercentInputs(initPercentageInputs(members))
        setAmountInputs({})
        return
      }
      setAmountInputs(initAmountInputs(total, members))
      setPercentInputs({})
    },
    [members, total]
  )

  const updatePercent = useCallback((memberId, value) => {
    setPercentInputs((prev) => ({ ...prev, [memberId]: value }))
  }, [])

  const updateAmount = useCallback((memberId, value) => {
    setAmountInputs((prev) => ({ ...prev, [memberId]: value }))
  }, [])

  const pctSum = roundMoney(splits.reduce((sum, row) => sum + roundMoney(row.percentage ?? 0), 0))
  const amtSum = roundMoney(splits.reduce((sum, row) => sum + row.amount, 0))

  return {
    splitMode,
    splits,
    setMode,
    percentInputs,
    updatePercent,
    amountInputs,
    updateAmount,
    pctSum,
    amtSum,
    total,
  }
}
