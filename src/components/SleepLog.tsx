import { useState, useEffect, useCallback } from 'react';
import { Moon, Save, Calendar, Trash2, History } from 'lucide-react';
import { supabase, SleepLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validateSleepLog, getErrorMessage } from '../lib/validation';
import { ChipRow, ErrorBanner, EmptyState, FormMessage, LoadingSkeleton, QualityFaces } from './ui';

const DREAM_MOODS = ['Happy', 'Anxious', 'Fearful', 'Peaceful', 'Excited', 'Sad', 'Confused', 'Neutral'];
const DREAM_TYPES = ['Normal', 'Lucid', 'Recurring', 'Nightmare', 'Vivid', 'Fragment'];

export default function SleepLogCard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dreamRemembered, setDreamRemembered] = useState(false);

  const [formData, setFormData] = useState({
    bedtime: '',
    wake_time: '',
    total_hours: '',
    sleep_quality: '7',
    dream_recall_frequency: '0',
    dream_description: '',
    dream_mood: '',
    dream_type: '',
    dream_vividness: '3',
    awakenings: '0'
  });

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    loadLogForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, logs]);

  // Auto-calculate total hours when bedtime or wake time changes
  useEffect(() => {
    if (formData.bedtime && formData.wake_time) {
      const totalHours = calculateTotalHours(formData.bedtime, formData.wake_time);
      setFormData(prev => ({ ...prev, total_hours: totalHours.toString() }));
    }
  }, [formData.bedtime, formData.wake_time]);

  const calculateTotalHours = (bedtime: string, wakeTime: string): number => {
    if (!bedtime || !wakeTime) return 0;
    
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    const bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;
    
    // Handle overnight sleep (bedtime after midnight, wake time next day)
    if (bedMinutes > wakeMinutes) {
      // Sleep crosses midnight
      wakeMinutes += 24 * 60; // Add 24 hours to wake time
    }
    
    const totalMinutes = wakeMinutes - bedMinutes;
    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
  };

  const loadLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setLoadError('');
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: unknown) {
      console.error('Error loading logs:', error);
      setLoadError(getErrorMessage(error, 'Could not load your sleep logs.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadLogForDate = (date: string) => {
    const log = logs.find(l => l.log_date === date);
    if (log) {
      setFormData({
        bedtime: log.bedtime || '',
        wake_time: log.wake_time || '',
        total_hours: log.total_hours?.toString() || '',
        sleep_quality: log.sleep_quality?.toString() || '7',
        dream_recall_frequency: log.dream_recall_frequency?.toString() || '0',
        dream_description: log.dream_description || '',
        dream_mood: log.dream_mood || '',
        dream_type: log.dream_type || '',
        dream_vividness: log.dream_vividness?.toString() || '3',
        awakenings: log.awakenings?.toString() || '0'
      });
      setDreamRemembered(
        Boolean(log.dream_recall_frequency && log.dream_recall_frequency > 0) ||
          Boolean(log.dream_description) ||
          Boolean(log.dream_mood) ||
          Boolean(log.dream_type)
      );
    } else {
      setFormData({
        bedtime: '',
        wake_time: '',
        total_hours: '',
        sleep_quality: '7',
        dream_recall_frequency: '0',
        dream_description: '',
        dream_mood: '',
        dream_type: '',
        dream_vividness: '3',
        awakenings: '0'
      });
      setDreamRemembered(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = validateSleepLog({
      log_date: selectedDate,
      bedtime: formData.bedtime,
      wake_time: formData.wake_time,
      total_hours: formData.total_hours,
      sleep_quality: formData.sleep_quality,
      dream_recall_frequency: formData.dream_recall_frequency,
      dream_vividness: formData.dream_vividness,
      awakenings: formData.awakenings,
      dream_description: formData.dream_description,
    });
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    setMessage('');

    try {
      const logData = {
        user_id: user.id,
        log_date: selectedDate,
        bedtime: formData.bedtime || null,
        wake_time: formData.wake_time || null,
        total_hours: formData.total_hours ? parseFloat(formData.total_hours) : null,
        sleep_quality: formData.sleep_quality ? parseInt(formData.sleep_quality) : null,
        dream_recall_frequency: formData.dream_recall_frequency ? parseInt(formData.dream_recall_frequency) : 0,
        dream_description: formData.dream_description || null,
        dream_mood: formData.dream_mood || null,
        dream_type: formData.dream_type || null,
        dream_vividness: formData.dream_vividness ? parseInt(formData.dream_vividness) : null,
        awakenings: formData.awakenings ? parseInt(formData.awakenings) : 0
      };

      const { error } = await supabase
        .from('sleep_logs')
        .upsert(logData, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      setMessage('Sleep log saved successfully!');
      await loadLogs();
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error, 'Could not save sleep log.')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm(`Delete the sleep log for ${selectedDate}? This cannot be undone.`)) return;

    setDeleting(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('log_date', selectedDate);
      if (error) throw error;
      setMessage('Sleep log deleted.');
      setFormData({
        bedtime: '',
        wake_time: '',
        total_hours: '',
        sleep_quality: '7',
        dream_recall_frequency: '0',
        dream_description: '',
        dream_mood: '',
        dream_type: '',
        dream_vividness: '3',
        awakenings: '0'
      });
      await loadLogs();
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error, 'Could not delete sleep log.')}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSkeleton lines={4} />;

  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-dark-accent p-2 rounded-lg">
          <Moon className="w-5 h-5 text-dark-accent-light" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-dark-text">Sleep & Dream Log</h2>
          <p className="text-xs text-dark-text-secondary">Track your sleep patterns and dreams</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-dark-text-secondary mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="px-4 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loadError && (
          <ErrorBanner message={`Could not load sleep logs: ${loadError}`} onRetry={loadLogs} />
        )}

        {errors.length > 0 && (
          <div role="alert" className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-red-300 text-sm font-medium mb-1">Please fix the following:</p>
            <ul className="list-disc list-inside text-red-300 text-sm space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Bedtime
            </label>
            <input
              type="time"
              value={formData.bedtime}
              onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Wake Time
            </label>
            <input
              type="time"
              value={formData.wake_time}
              onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Total Hours (Auto-calculated)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.total_hours ? `${formData.total_hours}h` : '0.0h'}
                readOnly
                className="w-full px-3 py-2 bg-dark-tertiary/50 border border-dark-border rounded-lg text-dark-text font-semibold cursor-not-allowed"
                placeholder="0.0h"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`w-2 h-2 rounded-full ${
                  parseFloat(formData.total_hours || '0') >= 7 && parseFloat(formData.total_hours || '0') <= 9 
                    ? 'bg-green-500' 
                    : parseFloat(formData.total_hours || '0') >= 6 && parseFloat(formData.total_hours || '0') < 7
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}></div>
              </div>
            </div>
            <p className="text-xs text-dark-text-muted mt-1">
              {parseFloat(formData.total_hours || '0') >= 7 && parseFloat(formData.total_hours || '0') <= 9 
                ? '✅ Optimal sleep duration' 
                : parseFloat(formData.total_hours || '0') >= 6 && parseFloat(formData.total_hours || '0') < 7
                ? '⚠️ Slightly short sleep'
                : parseFloat(formData.total_hours || '0') > 9
                ? '⚠️ Extended sleep duration'
                : '❌ Insufficient sleep'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <QualityFaces
              value={formData.sleep_quality ? parseInt(formData.sleep_quality, 10) : undefined}
              onChange={(v) => setFormData({ ...formData, sleep_quality: v !== undefined ? String(v) : '' })}
              label="How was your sleep?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Number of Awakenings
            </label>
            <input
              type="number"
              min="0"
              value={formData.awakenings}
              onChange={(e) => setFormData({ ...formData, awakenings: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-dark-text mb-3">Dream Details</h3>

          <ChipRow
            options={[
              { label: 'No', value: 'no' },
              { label: 'Yes, I remember one', value: 'yes' }
            ]}
            value={dreamRemembered ? 'yes' : 'no'}
            onChange={(v) => setDreamRemembered(v === 'yes')}
            label="Did you remember a dream?"
          />
          <p className="text-xs text-dark-text-muted -mt-1">
            {dreamRemembered
              ? 'Great — add a few quick details below. Everything is optional.'
              : 'No dream details needed then — that keeps logging fast.'}
          </p>

          {dreamRemembered && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Dream Recall Frequency
            </label>
            <input
              type="number"
              min="0"
              value={formData.dream_recall_frequency}
              onChange={(e) => setFormData({ ...formData, dream_recall_frequency: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
              placeholder="Number of dreams recalled"
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Dream Vividness (1-5)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="5"
                value={formData.dream_vividness}
                onChange={(e) => setFormData({ ...formData, dream_vividness: e.target.value })}
                className="flex-1 accent-dark-accent-light"
              />
              <span className="text-lg font-semibold text-dark-accent-light w-8 text-center">
                {formData.dream_vividness}
              </span>
            </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
            <ChipRow
              options={DREAM_MOODS.map(mood => ({ label: mood, value: mood }))}
              value={formData.dream_mood}
              onChange={(v) => setFormData({ ...formData, dream_mood: v })}
              label="Dream Mood"
              clearable
            />
            </div>

            <div>
            <ChipRow
              options={DREAM_TYPES.map(type => ({ label: type, value: type }))}
              value={formData.dream_type}
              onChange={(v) => setFormData({ ...formData, dream_type: v })}
              label="Dream Type"
              clearable
            />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Dream Description
            </label>
            <textarea
              value={formData.dream_description}
              onChange={(e) => setFormData({ ...formData, dream_description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
              placeholder="Describe your dream in detail..."
            />
          </div>
          </>
          )}
        </div>

        {message && <FormMessage message={message} />}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-dark-accent hover:bg-dark-accent-dark disabled:bg-dark-accent/50 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-dark-accent-light hover:border-dark-accent-light/50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Sleep Log'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="sm:w-auto w-full px-4 py-3 rounded-lg font-semibold border border-red-800 text-red-300 hover:bg-red-900/30 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-dark-border pt-4">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-medium text-dark-text-secondary hover:text-dark-text transition"
          aria-expanded={showHistory}
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Hide recent entries' : `Show recent entries (${logs.length})`}
        </button>
        {showHistory && (
          logs.length === 0 ? (
            <EmptyState
              title="No sleep logs yet"
              hint="Save your first sleep log above to start building your history."
            />
          ) : (
            <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {logs.map((log) => (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(log.log_date)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition text-sm flex items-center justify-between gap-2 ${
                      log.log_date === selectedDate
                        ? 'border-dark-accent-light bg-dark-accent/20 text-dark-text'
                        : 'border-dark-border bg-dark-tertiary/40 text-dark-text-secondary hover:text-dark-text hover:border-dark-border-light'
                    }`}
                  >
                    <span className="font-medium">{log.log_date}</span>
                    <span className="text-xs">
                      {log.total_hours != null ? `${log.total_hours}h` : '—'}
                      {log.sleep_quality != null ? ` · quality ${log.sleep_quality}/10` : ''}
                      {log.dream_description ? ' · dream' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
