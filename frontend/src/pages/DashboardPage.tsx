import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, extractError } from '../api';
import type { Profile } from '../types';
import ProfileCard from '../components/ProfileCard';
import OrdersTable from '../components/OrdersTable';
import SupportForm from '../components/SupportForm';
import AssistantChat from '../components/AssistantChat';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(extractError(err, 'Failed to load profile.')));
  }, []);

  return (
    <div className="app-shell app-shell--dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">4BLANC</span>
          <span className="brand-sub">Client Portal</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user muted" title={user?.email ?? undefined}>
            {user?.name ?? user?.email}
          </span>
          <button type="button" className="btn-ghost topbar-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard">
        {error && <div className="form-error">{error}</div>}
        <div className="grid">
          <div className="col-main">
            {profile && <ProfileCard profile={profile} />}
            <OrdersTable />
          </div>
          <div className="col-side">
            <SupportForm />
          </div>
        </div>
      </main>

      <AssistantChat />
    </div>
  );
}
