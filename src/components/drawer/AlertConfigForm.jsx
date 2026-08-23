import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Info, TrendingDown, TrendingUp, Zap, Send } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useDrawer } from '../../hooks/useDrawer'
import { useUpdateAlertRule } from '../../hooks/queries/useAlertRuleQuery'
import { useLastTriggered } from '../../hooks/queries/useLastTriggeredQuery'
import { AlertLevelRow } from './AlertLevelRow'
import { Button } from '../ui/Button'

const alertSchema = z.object({
  supportLevel: z.string().optional(),
  resistanceLevel: z.string().optional(),
  breakoutLevel: z.string().optional(),
  supportEnabled: z.boolean(),
  resistanceEnabled: z.boolean(),
  breakoutEnabled: z.boolean(),
}).superRefine((data, ctx) => {
  const checkLevel = (val, fieldName) => {
    if (val && (isNaN(parseFloat(val)) || parseFloat(val) <= 0 || parseFloat(val) >= 100000)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid PKR price', path: [fieldName] })
    }
  }

  if (data.supportEnabled) checkLevel(data.supportLevel, 'supportLevel')
  if (data.resistanceEnabled) checkLevel(data.resistanceLevel, 'resistanceLevel')
  if (data.breakoutEnabled) checkLevel(data.breakoutLevel, 'breakoutLevel')

  const s = parseFloat(data.supportLevel)
  const r = parseFloat(data.resistanceLevel)
  const b = parseFloat(data.breakoutLevel)

  if (data.supportEnabled && data.resistanceEnabled && s && r && r <= s) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resistance must be > Support', path: ['resistanceLevel'] })
  }

  if (data.breakoutEnabled && b && data.resistanceEnabled && r && b <= r) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Breakout must be > Resistance', path: ['breakoutLevel'] })
  }
})

export function AlertConfigForm() {
  const { security } = useDrawer()
  const { data: lastTriggered } = useLastTriggered(security?.symbol)
  const updateMutation = useUpdateAlertRule()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      supportLevel: '',
      resistanceLevel: '',
      breakoutLevel: '',
      supportEnabled: false,
      resistanceEnabled: false,
      breakoutEnabled: false,
    }
  })

  // Reset form whenever the drawer opens on a new symbol (security.alert_rule loads async)
  useEffect(() => {
    if (!security) return
    const rule = security.alert_rule
    reset({
      supportLevel: rule?.support_level != null ? String(rule.support_level) : '',
      resistanceLevel: rule?.resistance_level != null ? String(rule.resistance_level) : '',
      breakoutLevel: rule?.breakout_level != null ? String(rule.breakout_level) : '',
      supportEnabled: rule?.support_enabled ?? false,
      resistanceEnabled: rule?.resistance_enabled ?? false,
      breakoutEnabled: rule?.breakout_enabled ?? false,
    })
  }, [security?.symbol, security?.alert_rule, reset])

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      await updateMutation.mutateAsync({
        symbol: security.symbol,
        support_level: data.supportEnabled && data.supportLevel ? parseFloat(data.supportLevel) : null,
        support_enabled: data.supportEnabled,
        resistance_level: data.resistanceEnabled && data.resistanceLevel ? parseFloat(data.resistanceLevel) : null,
        resistance_enabled: data.resistanceEnabled,
        breakout_level: data.breakoutEnabled && data.breakoutLevel ? parseFloat(data.breakoutLevel) : null,
        breakout_enabled: data.breakoutEnabled,
      })
      queryClient.invalidateQueries({ queryKey: ['drawer-security', security.symbol] })
    } catch (_err) {
      // error toast handled by mutation onError
    } finally {
      setIsSaving(false)
    }
  }

  const [isTesting, setIsTesting] = useState(false)

  const handleTestNotification = async () => {
    setIsTesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { test: true, symbol: security?.symbol }
      })
      if (error) throw error
      if (data?.sent) {
        toast.success('✓ Test notification delivered to your device')
      } else {
        toast(`Push not sent: ${data?.reason ?? 'enable push notifications in Settings first'}`)
      }
    } catch (err) {
      console.error('Test notification failed:', err.message)
      toast.error('Push notifications are not available yet')
    } finally {
      setIsTesting(false)
    }
  }

  if (!security) return null

  const rows = [
    { type: 'support', label: 'Support', icon: <TrendingDown size={16} />, color: 'green', error: errors.supportLevel, last: lastTriggered?.support ?? null },
    { type: 'resistance', label: 'Resistance', icon: <TrendingUp size={16} />, color: 'red', error: errors.resistanceLevel, last: lastTriggered?.resistance ?? null },
    { type: 'breakout', label: 'Breakout', icon: <Zap size={16} />, color: 'amber', error: errors.breakoutLevel, last: lastTriggered?.breakout ?? null },
  ]

  return (
    <div className="px-5 pt-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-[16px] font-bold text-text-primary tracking-tighter">Alert Levels</h3>
        <span className="text-[11.5px] text-text-tertiary">PKR</span>
      </div>
      <p className="text-[12.5px] text-text-secondary leading-relaxed mb-4">
        Arm a level and StrikeLine watches the live price for you.
      </p>

      <div className="flex flex-col gap-2.5">
        {rows.map(r => (
          <div key={r.type}>
            <AlertLevelRow
              type={r.type}
              label={r.label}
              icon={r.icon}
              color={r.color}
              register={register}
              watch={watch}
              setValue={setValue}
              lastTriggered={r.last}
            />
            {r.error && (
              <span className="block text-[11.5px] font-medium text-signal-red mt-1.5 ml-1">
                {r.error.message}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 mt-4 rounded-[12px] bg-brand-blueSoft/70 ring-1 ring-inset ring-brand-blue/10 px-3 py-2.5">
        <Info size={14} className="text-brand-blue shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-text-secondary leading-relaxed">
          Alerts fire within <span className="font-semibold text-text-primary">1%</span> of a level, and again
          the moment it&apos;s actually hit. Repeat heads-ups are spaced at least{' '}
          <span className="font-semibold text-text-primary">90 minutes</span> apart.
        </p>
      </div>

      <button
        type="button"
        onClick={handleTestNotification}
        disabled={isTesting}
        className="sl-tap w-full mt-3 h-10 rounded-[10px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand-blue hover:bg-brand-blueSoft transition-colors disabled:opacity-50"
      >
        <Send size={14} />
        {isTesting ? 'Sending…' : 'Send test notification'}
      </button>

      {/* Pinned to the bottom of the drawer's scroll viewport — the primary
          action stays in the thumb zone no matter how far you have scrolled. */}
      <div
        className="sticky bottom-0 -mx-5 mt-4 px-5 pt-3 sl-glass-strong border-t border-surface-hairline"
        style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          type="button"
          loading={isSaving}
          onClick={handleSubmit(onSubmit)}
        >
          {isSaving ? 'Saving…' : 'Save alert levels'}
        </Button>
      </div>
    </div>
  )
}
