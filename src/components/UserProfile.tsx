import { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfileCard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    occupation: '',
    sleep_habits: '',
    medical_history: '',
    medications: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          occupation: data.occupation || '',
          sleep_habits: data.sleep_habits || '',
          medical_history: data.medical_history || '',
          medications: data.medications || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const profileData = {
        id: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender || null,
        occupation: formData.occupation || null,
        sleep_habits: formData.sleep_habits || null,
        medical_history: formData.medical_history || null,
        medications: formData.medications || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) throw error;

      setMessage('Profile saved successfully!');
      await loadProfile();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-secondary rounded-xl shadow-lg p-6 border border-dark-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-tertiary rounded w-1/3"></div>
          <div className="h-10 bg-dark-tertiary rounded"></div>
          <div className="h-10 bg-dark-tertiary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-border max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-dark-accent p-2 rounded-lg">
          <User className="w-5 h-5 text-dark-accent-light" />
        </div>
        <h2 className="text-xl font-bold text-dark-text">User Profile</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Age <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="150"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              Occupation
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1">
            Sleep Habits & Preferences
          </label>
          <textarea
            value={formData.sleep_habits}
            onChange={(e) => setFormData({ ...formData, sleep_habits: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            placeholder="E.g., prefer sleeping on right side, need complete darkness..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1">
            Relevant Medical History
          </label>
          <textarea
            value={formData.medical_history}
            onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            placeholder="Any sleep disorders, conditions, or relevant medical history..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-1">
            Medications & Supplements
          </label>
          <textarea
            value={formData.medications}
            onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-dark-tertiary border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-accent-light text-dark-text placeholder-dark-text-muted"
            placeholder="Current medications and supplements..."
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-900/20 text-red-300 border border-red-800' : 'bg-green-900/20 text-green-300 border border-green-800'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-dark-accent hover:bg-dark-accent-dark disabled:bg-dark-accent/50 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-dark-accent-light hover:border-dark-accent-light/50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
