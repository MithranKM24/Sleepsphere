import { useState, useEffect, useCallback } from 'react';
import { Activity, Save, Calendar, Trash2, History } from 'lucide-react';
import { supabase, LifestyleLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validateLifestyleLog, getErrorMessage } from '../lib/validation';
import { ChipRow, ErrorBanner, EmptyState, FormMessage, LoadingSkeleton } from './ui';

const EXERCISE_INTENSITIES = ['Low', 'Moderate', 'High'];
const NOISE_LEVELS = ['Quiet', 'Moderate', 'Loud'];
const LIGHT_LEVELS = ['Dark', 'Dim', 'Bright'];

export default function LifestyleLogCard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LifestyleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    stress_level: '5',
    exercise_duration: '0',
    exercise_intensity: '',
    caffeine_intake: '0',
    alcohol_intake: '0',
    screen_time: '0',
    last_meal_time: '',
    room_temperature: '',
    noise_level: '',
    light_level: ''
  });

  useEffect(() => {
    void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    loadLogForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, logs]);

  const loadLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setLoadError('');
    try {
      const { data, error } = await supabase
        .from('lifestyle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: unknown) {
      console.error('Error loading logs:', error);
      setLoadError(getErrorMessage(error, 'Could not load your lifestyle logs.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadLogForDate = (date: string) => {
    const log = logs.find(l => l.log_date === date);
    if (log) {
      setFormData({
        stress_level: log.stress_level?.toString() || '5',
        exercise_duration: log.exercise_duration?.toString() || '0',
        exercise_intensity: log.exercise_intensity || '',
        caffeine_intake: log.caffeine_intake?.toString() || '0',
        alcohol_intake: log.alcohol_intake?.toString() || '0',
        screen_time: log.screen_time?.toString() || '0',
        last_meal_time: log.last_meal_time || '',
        room_temperature: log.room_temperature?.toString() || '',
        noise_level: log.noise_level || '',
        light_level: log.light_level || ''
      });
    } else {
      setFormData({
        stress_level: '5',
        exercise_duration: '0',
        exercise_intensity: '',
        caffeine_intake: '0',
        alcohol_intake: '0',
        screen_time: '0',
        last_meal_time: '',
        room_temperature: '',
        noise_level: '',
        light_level: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = validateLifestyleLog({
      log_date: selectedDate,
      stress_level: formData.stress_level,
      exercise_duration: formData.exercise_duration,
      caffeine_intake: formData.caffeine_intake,
      alcohol_intake: formData.alcohol_intake,
      screen_time: formData.screen_time,
      room_temperature: formData.room_temperature,
    });
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    setSaving(true);
    setMessage('');

    try {
      const logData = {
        user_id: user.id,
        log_date: selectedDate,
        stress_level: formData.stress_level ? parseInt(formData.stress_level) : null,
        exercise_duration: formData.exercise_duration ? parseInt(formData.exercise_duration) : 0,
        exercise_intensity: formData.exercise_intensity || null,
        caffeine_intake: formData.caffeine_intake ? parseInt(formData.caffeine_intake) : 0,
        alcohol_intake: formData.alcohol_intake ? parseInt(formData.alcohol_intake) : 0,
        screen_time: formData.screen_time ? parseInt(formData.screen_time) : 0,
        last_meal_time: formData.last_meal_time || null,
        room_temperature: formData.room_temperature ? parseFloat(formData.room_temperature) : null,
        noise_level: formData.noise_level || null,
        light_level: formData.light_level || null
      };

      const { error } = await supabase
        .from('lifestyle_logs')
        .upsert(logData, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      setMessage('Lifestyle log saved successfully!');
      await loadLogs();
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error, 'Could not save lifestyle log.')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm(`Delete the lifestyle log for ${selectedDate}? This cannot be undone.`)) return;

    setDeleting(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('lifestyle_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('log_date', selectedDate);
      if (error) throw error;
      setMessage('Lifestyle log deleted.');
      setFormData({
        stress_level: '5',
        exercise_duration: '0',
        exercise_intensity: '',
        caffeine_intake: '0',
        alcohol_intake: '0',
        screen_time: '0',
        last_meal_time: '',
        room_temperature: '',
        noise_level: '',
        light_level: ''
      });
      await loadLogs();
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error, 'Could not delete lifestyle log.')}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSkeleton lines={4} />;

  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-600 p-2 rounded-lg">
          <Activity className="w-5 h-5 text-green-200" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-dark-text">Lifestyle Data</h2>
          <p className="text-xs text-dark-text-secondary">Track factors affecting your sleep</p>
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
          className="px-4 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loadError && (
          <ErrorBanner message={`Could not load lifestyle logs: ${loadError}`} onRetry={loadLogs} />
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

        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1">
            Daily Stress Level (1-10)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.stress_level}
              onChange={(e) => setFormData({ ...formData, stress_level: e.target.value })}
              className="flex-1 accent-green-500"
            />
            <span className="text-lg font-semibold text-green-400 w-8 text-center">
              {formData.stress_level}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-dark-text mb-3">Exercise & Activity</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Exercise Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.exercise_duration}
                onChange={(e) => setFormData({ ...formData, exercise_duration: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
              />
            </div>

            <div>
              <ChipRow
                options={EXERCISE_INTENSITIES.map(intensity => ({ label: intensity, value: intensity }))}
                value={formData.exercise_intensity}
                onChange={(v) => setFormData({ ...formData, exercise_intensity: v })}
                label="Exercise Intensity"
                clearable
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-dark-text mb-3">Consumption</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Caffeine Intake (servings)
              </label>
              <input
                type="number"
                min="0"
                value={formData.caffeine_intake}
                onChange={(e) => setFormData({ ...formData, caffeine_intake: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Alcohol Intake (servings)
              </label>
              <input
                type="number"
                min="0"
                value={formData.alcohol_intake}
                onChange={(e) => setFormData({ ...formData, alcohol_intake: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Last Meal Time
              </label>
              <input
                type="time"
                value={formData.last_meal_time}
                onChange={(e) => setFormData({ ...formData, last_meal_time: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-dark-text mb-3">Sleep Environment</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Screen Time Before Bed (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.screen_time}
                onChange={(e) => setFormData({ ...formData, screen_time: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Room Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.room_temperature}
                onChange={(e) => setFormData({ ...formData, room_temperature: e.target.value })}
                className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-dark-text"
                placeholder="20.0"
              />
            </div>

            <div>
              <ChipRow
                options={NOISE_LEVELS.map(level => ({ label: level, value: level }))}
                value={formData.noise_level}
                onChange={(v) => setFormData({ ...formData, noise_level: v })}
                label="Noise Level"
                clearable
              />
            </div>

            <div>
              <ChipRow
                options={LIGHT_LEVELS.map(level => ({ label: level, value: level }))}
                value={formData.light_level}
                onChange={(v) => setFormData({ ...formData, light_level: v })}
                label="Light Level"
                clearable
              />
            </div>
          </div>
        </div>

        {message && <FormMessage message={message} />}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-green-500 hover:border-green-400"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Lifestyle Log'}
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
              title="No lifestyle logs yet"
              hint="Save your first lifestyle log above to start tracking."
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
                        ? 'border-green-500 bg-green-900/20 text-dark-text'
                        : 'border-dark-border bg-dark-tertiary/40 text-dark-text-secondary hover:text-dark-text hover:border-dark-border-light'
                    }`}
                  >
                    <span className="font-medium">{log.log_date}</span>
                    <span className="text-xs">
                      {log.stress_level != null ? `stress ${log.stress_level}/10` : '—'}
                      {log.exercise_duration ? ` · ${log.exercise_duration} min exercise` : ''}
                      {log.caffeine_intake ? ` · ${log.caffeine_intake} caffeine` : ''}
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
