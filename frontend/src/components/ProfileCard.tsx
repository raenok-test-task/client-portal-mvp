import type { Profile } from '../types';

export default function ProfileCard({ profile }: { profile: Profile }) {
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <section className="card profile-card">
      <h2 className="card-title">Profile</h2>
      <div className="profile">
        <div className="avatar">{initials}</div>
        <div className="profile-fields">
          <Field label="Name" value={profile.name} />
          <Field label="Email" value={profile.email} />
          <Field label="Phone" value={profile.phone ?? '—'} />
          <Field label="Company" value={profile.company ?? '—'} />
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}
