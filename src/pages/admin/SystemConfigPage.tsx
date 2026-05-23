import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Info } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { AppConfig } from '../../types';

interface ConfigField {
  key: keyof AppConfig;
  label: string;
  description: string;
  unit?: string;
  min: number;
  max: number;
}

const CONFIG_FIELDS: ConfigField[] = [
  { key: 'report_threshold', label: 'Report Threshold', description: 'Weighted score to auto-hide a post', min: 1, max: 50 },
  { key: 'max_daily_posts', label: 'Max Daily Posts', description: 'Hard ceiling — max posts per user per day', min: 1, max: 100 },
  { key: 'min_daily_posts', label: 'Min Daily Posts', description: 'Hard floor — even restricted users can post this many', min: 1, max: 10 },
  { key: 'ban_threshold', label: 'Ban Alert Threshold', description: 'Confirmed bad posts before faculty gets alerted', min: 1, max: 50 },
  { key: 'chat_rate_limit_ms', label: 'Chat Rate Limit (ms)', description: 'Cooldown between messages', unit: 'ms', min: 500, max: 10000 },
  { key: 'auto_delete_days', label: 'Auto-Delete Chat Days', description: 'Days before old chat messages auto-delete', min: 1, max: 90 },
];

const DEFAULTS: Omit<AppConfig, 'id' | 'updated_at' | 'updated_by'> = {
  report_threshold: 5,
  max_daily_posts: 20,
  min_daily_posts: 1,
  ban_threshold: 10,
  chat_rate_limit_ms: 3000,
  auto_delete_days: 7,
};

export default function SystemConfigPage() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [values, setValues] = useState<typeof DEFAULTS>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from('app_config')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConfig(data as AppConfig);
          setValues({
            report_threshold: data.report_threshold,
            max_daily_posts: data.max_daily_posts,
            min_daily_posts: data.min_daily_posts,
            ban_threshold: data.ban_threshold,
            chat_rate_limit_ms: data.chat_rate_limit_ms,
            auto_delete_days: data.auto_delete_days,
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const payload = { ...values, updated_by: profile.id, updated_at: new Date().toISOString() };

    if (config?.id) {
      await supabase.from('app_config').update(payload).eq('id', config.id);
    } else {
      const { data } = await supabase.from('app_config').insert(payload).select().single();
      setConfig(data as AppConfig);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast.success('Configuration saved!');
    setSaving(false);
  };

  const handleReset = () => {
    setValues({ ...DEFAULTS });
  };

  if (loading) {
    return (
      <div className="space-y-3 max-w-lg mx-auto">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
          <Settings size={20} className="text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">System Config</h1>
          {config?.updated_at && (
            <p className="text-xs text-[var(--text-secondary)]">
              Last updated: {format(new Date(config.updated_at), 'd MMM yyyy, h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Config fields */}
      <div className="space-y-3">
        {CONFIG_FIELDS.map(({ key, label, description, unit, min, max }) => (
          <div key={key} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">{label}</label>
                  {unit && <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-raised)] px-1.5 py-0.5 rounded">{unit}</span>}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  value={(values as Record<string, number>)[key]}
                  onChange={e => setValues(v => ({ ...v, [key]: Number(e.target.value) }))}
                  min={min}
                  max={max}
                  className="w-20 input-field py-2 text-center font-bold text-sm"
                />
              </div>
            </div>
            {/* Slider */}
            <input
              type="range"
              min={min}
              max={max}
              value={(values as Record<string, number>)[key]}
              onChange={e => setValues(v => ({ ...v, [key]: Number(e.target.value) }))}
              className="w-full mt-3 accent-[var(--gold)] h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1 opacity-60">
              <span>{min}</span>
              <span>Default: {(DEFAULTS as Record<string, number>)[key]}</span>
              <span>{max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-400">
          Changes take effect immediately for new actions. Existing events and reports are not retroactively affected.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="btn-outline-gold flex-1 py-3 text-sm"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold flex-1 py-3 text-sm flex items-center justify-center gap-2"
        >
          {saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : saving ? (
            <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> Save Config</>
          )}
        </button>
      </div>
    </div>
  );
}
