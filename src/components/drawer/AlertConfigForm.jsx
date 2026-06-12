import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, TrendingDown, TrendingUp, Zap } from 'lucide-react'
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
  bufferPct: z.number().min(0).max(2),
  cooldownMinutes: z.number().min(30).max(1440),
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
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      bufferPct: 0.5,
      cooldownMinutes: 240,
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
      bufferPct: rule?.buffer_pct ?? 0.5,
      cooldownMinutes: rule?.cooldown_minutes ?? 240,
    })
  }, [security?.symbol, security?.alert_rule, reset])

  const bufferPct = watch('bufferPct')
  const cooldownMinutes = watch('cooldownMinutes')

  const formatCooldown = (mins) => {
    if (mins < 60) return `${mins} minutes`
    const hrs = mins / 60
    return `${hrs} hour${hrs > 1 ? 's' : ''}`
  }

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
        buffer_pct: data.bufferPct,
        cooldown_minutes: data.cooldownMinutes,
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[18px] font-bold text-text-primary">Alert Levels</h3>
        <div className="relative group cursor-help text-text-secondary">
          <Info size={16} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-[8px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 pointer-events-none">
            You'll be notified when the live price touches or crosses any enabled level, within your configured buffer.
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-4">
        <AlertLevelRow
          type="support" label="Support Level"
          icon={<TrendingDown size={16} />} color="green"
          register={register} watch={watch} setValue={setValue}
          lastTriggered={lastTriggered?.support ?? null}
        />
        {errors.supportLevel && (
          <span className="text-[12px] text-signal-red mt-1">{errors.supportLevel.message}</span>
        )}

        <AlertLevelRow
          type="resistance" label="Resistance Level"
          icon={<TrendingUp size={16} />} color="red"
          register={register} watch={watch} setValue={setValue}
          lastTriggered={lastTriggered?.resistance ?? null}
        />
        {errors.resistanceLevel && (
          <span className="text-[12px] text-signal-red mt-1">{errors.resistanceLevel.message}</span>
        )}

        <AlertLevelRow
          type="breakout" label="Breakout Level"
          icon={<Zap size={16} />} color="amber"
          register={register} watch={watch} setValue={setValue}
          lastTriggered={lastTriggered?.breakout ?? null}
        />
        {errors.breakoutLevel && (
          <span className="text-[12px] text-signal-red mt-1">{errors.breakoutLevel.message}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-[13px] text-brand-blue font-medium hover:underline flex items-center mb-4"
      >
        Advanced Settings {showAdvanced ? '▴' : '▾'}
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-6"
          >
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[14px] font-semibold text-text-primary">Notification Buffer</span>
                <span className="text-[14px] font-bold text-brand-navy">{bufferPct.toFixed(1)}%</span>
              </div>
              <input
                type="range" min="0" max="2" step="0.1"
                {...register('bufferPct', { valueAsNumber: true })}
                className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer custom-slider"
                style={{ backgroundSize: `${(bufferPct / 2) * 100}% 100%` }}
              />
              <p className="text-[12px] text-text-secondary mt-1">Alert fires within ±{bufferPct.toFixed(1)}% of target level</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[14px] font-semibold text-text-primary">Cooldown Period</span>
                <span className="text-[14px] font-bold text-brand-navy">{formatCooldown(cooldownMinutes)}</span>
              </div>
              <input
                type="range" min="30" max="1440" step="30"
                {...register('cooldownMinutes', { valueAsNumber: true })}
                className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer custom-slider"
                style={{ backgroundSize: `${((cooldownMinutes - 30) / 1410) * 100}% 100%` }}
              />
              <p className="text-[12px] text-text-secondary mt-1">{formatCooldown(cooldownMinutes)} between repeat alerts on the same level</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 mt-6">
        <Button
          variant="primary"
          className="w-full"
          type="button"
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
        >
          {isSaving ? 'Saving...' : 'Save Alert'}
        </Button>
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={isTesting}
          className="text-[14px] text-brand-blue text-center hover:underline font-medium disabled:opacity-50"
        >
          {isTesting ? 'Sending…' : 'Send test notification'}
        </button>
      </div>
    </div>
  )
}
