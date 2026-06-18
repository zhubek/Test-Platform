"use client";

// Catalog page component (universities & colleges "Details & contacts").
// Props ARE the form fields — translatable text is a Localized JSON ({en,ru,kk}),
// plain text is a string. Controlled: changes are reported via onChange(patch).

import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { LocalizedInput } from "./localized-input";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export interface ContactDetailsFields {
  address: Localized; // translatable → JSON with language keys
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  photo: string;
}

interface Props extends ContactDetailsFields {
  onChange: (patch: Partial<ContactDetailsFields>) => void;
  onBlur?: () => void;
}

export function ContactDetailsForm({
  address,
  email,
  phone,
  website,
  instagram,
  facebook,
  youtube,
  photo,
  onChange,
  onBlur,
}: Props) {
  const { t } = useLocale();
  return (
    <div
      className="space-y-3"
      onBlur={(e) => {
        if (onBlur && !e.currentTarget.contains(e.relatedTarget as Node)) onBlur();
      }}
    >
      <Field label={t("cm.methodic.field.address")}>
        <LocalizedInput
          value={address}
          onChange={(v) => onChange({ address: v })}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("cm.methodic.field.email")}>
          <input type="text" value={email} onChange={(e) => onChange({ email: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("cm.methodic.field.phone")}>
          <input type="text" value={phone} onChange={(e) => onChange({ phone: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <Field label={t("cm.methodic.field.website")}>
        <input type="text" value={website} onChange={(e) => onChange({ website: e.target.value })} className={inputClass} />
      </Field>

      <div className="my-1 border-t border-gray-100" />

      <div className="grid grid-cols-3 gap-3">
        <Field label={t("cm.methodic.field.instagram")}>
          <input type="text" value={instagram} onChange={(e) => onChange({ instagram: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("cm.methodic.field.facebook")}>
          <input type="text" value={facebook} onChange={(e) => onChange({ facebook: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t("cm.methodic.field.youtube")}>
          <input type="text" value={youtube} onChange={(e) => onChange({ youtube: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <Field label={t("cm.methodic.field.photo")}>
        <input type="text" value={photo} onChange={(e) => onChange({ photo: e.target.value })} className={inputClass + " max-w-xs"} />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[0.68rem] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
