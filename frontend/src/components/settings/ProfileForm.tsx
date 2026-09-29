import { useState, type FormEvent } from "react";
import type { Profile } from "../../api/models";
import { useUpdateProfile } from "../../api/queries";
import { initials } from "../../lib/format";
import { ROLE_LABEL } from "../../lib/status";
import { Button } from "../ui/Button";
import { SelectField, TextField } from "../ui/Field";

const DEPARTMENTS = ["Maintenance", "Production", "Engineering", "Quality", "Facilities", "Safety"];

type Draft = { full_name: string; email: string; role: string; department: string; plant: string };
const toDraft = (p: Profile): Draft => ({ full_name: p.full_name, email: p.email ?? "", role: p.role, department: p.department ?? "", plant: p.plant ?? "" });

/** Profile fields grouped with labels beside controls; Save is enabled only when something changed. Key it by the saved profile to reset. */
export function ProfileForm({ profile, canEditRole }: { profile: Profile; canEditRole: boolean }) {
  const update = useUpdateProfile();
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | "form", string>>>({});
  const [saved, setSaved] = useState(false);

  const original = toDraft(profile);
  const changed = (Object.keys(draft) as (keyof Draft)[]).filter((k) => draft[k].trim() !== original[k]);

  const bind = (key: keyof Draft) => ({
    value: draft[key],
    onChange: (e: { target: { value: string } }) => {
      setSaved(false);
      setDraft((d) => ({ ...d, [key]: e.target.value }));
    }
  });

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const e: typeof errors = {};
    if (draft.full_name.trim().length < 2) e.full_name = "Enter your full name.";
    if (draft.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) e.email = "Enter an email address like name@company.com.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const change = Object.fromEntries(changed.map((k) => [k, draft[k].trim() || null]));
    update.mutate(change, {
      onSuccess: () => setSaved(true),
      onError: (err) => setErrors({ form: err.message })
    });
  };

  const departments = draft.department && !DEPARTMENTS.includes(draft.department) ? [draft.department, ...DEPARTMENTS] : DEPARTMENTS;

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-5 p-5 rounded-[var(--radius-card)] bg-sunken border border-line">
        <span className="w-20 h-20 rounded-full bg-deck text-white text-[26px] font-semibold flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
          {initials(profile.full_name)}
        </span>
        <div className="min-w-0">
          <p className="text-heading font-bold tracking-[-0.02em] text-ink">{profile.full_name}</p>
          <p className="mt-0.5 text-copy text-body">
            {ROLE_LABEL[profile.role] ?? profile.role} · <span className="font-data font-medium text-ink">{profile.username}</span>
          </p>
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="p-3 rounded-[var(--radius-control)] bg-danger-bg text-meta font-medium text-danger-ink">
          Couldn't save your profile: {errors.form}
        </p>
      )}

      <fieldset className="space-y-5">
        <legend className="sr-only">Personal details</legend>
        <TextField inline label="Full name" required autoComplete="name" error={errors.full_name} {...bind("full_name")} />
        <TextField inline label="Email" type="email" autoComplete="email" placeholder="name@company.com" error={errors.email} {...bind("email")} />
      </fieldset>
      <fieldset className="space-y-5 pt-5 border-t border-line">
        <legend className="sr-only">Role and workplace</legend>
        <SelectField
          inline
          label="Role"
          disabled={!canEditRole}
          hint={canEditRole ? undefined : "Only an admin can change roles."}
          options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))}
          {...bind("role")}
        />
        <SelectField inline label="Department" placeholder="Not set" options={departments.map((d) => ({ value: d, label: d }))} {...bind("department")} />
        <TextField inline label="Plant" placeholder="Plant name" hint="Shown in the header." {...bind("plant")} />
      </fieldset>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && changed.length === 0 && (
          <p role="status" className="text-meta font-medium text-success">
            Changes saved.
          </p>
        )}
        <Button type="submit" variant="primary" disabled={changed.length === 0} loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
