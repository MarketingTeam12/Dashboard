import { useState } from 'react';
import Modal from './Modal';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s-]{6,17}$/;
const norm = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

export function validateFields(fields, values) {
  const errors = {};
  fields.forEach((f) => {
    if (f.hidden?.(values)) return;
    const v = values[f.name];
    const empty = v === '' || v == null;
    if (f.required && empty) errors[f.name] = `${f.label} is required.`;
    else if (!empty && f.type === 'email' && !EMAIL.test(v)) errors[f.name] = 'Enter a valid email address.';
    else if (!empty && f.type === 'tel' && !PHONE.test(String(v).trim())) errors[f.name] = 'Enter a valid phone number.';
    else if (!empty && f.type === 'number') {
      const n = Number(v);
      if (isNaN(n)) errors[f.name] = 'Enter a number.';
      else if (f.min != null && n < f.min) errors[f.name] = `Must be at least ${f.min}.`;
      else if (f.max != null && n > f.max) errors[f.name] = `Must be at most ${f.max}.`;
    }
    if (!errors[f.name] && f.validate) {
      const msg = f.validate(v, values);
      if (msg) errors[f.name] = msg;
    }
  });
  return errors;
}

function Field({ f, value, error, onChange, values }) {
  const base = `input ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`;
  let control;
  if (f.type === 'select') {
    const opts = typeof f.options === 'function' ? f.options(values) : f.options;
    control = (
      <select className={base} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {!f.required && <option value="">{f.placeholder || 'None'}</option>}
        {f.required && (value === '' || value == null) && <option value="">Select…</option>}
        {opts.map(norm).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (f.type === 'textarea') {
    control = <textarea className={`${base} h-auto py-2 min-h-[84px]`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
  } else if (f.type === 'checkbox') {
    control = (
      <label className="flex items-center gap-2 h-10 text-[13.5px] text-ink">
        <input type="checkbox" className="cb" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.checkLabel || f.label}
      </label>
    );
  } else {
    control = <input className={base} type={f.type || 'text'} value={value ?? ''} min={f.min} max={f.max} step={f.step} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
  }
  return (
    <div className={f.span === 2 ? 'sm:col-span-2' : ''}>
      {f.type !== 'checkbox' && (
        <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
          {f.label}{f.required && <span className="text-danger"> *</span>}
        </label>
      )}
      {control}
      {f.help && !error && <p className="text-[11.5px] text-ink-400 mt-1">{f.help}</p>}
      {error && <p className="text-[12px] text-danger-700 mt-1">{error}</p>}
    </div>
  );
}

/**
 * fields: [{ name, label, type, options, required, span, min, max, validate, hidden(values), onChangeEffect(value, values) => patch }]
 */
export default function FormModal({ open, onClose, title, subtitle, fields, initial, onSubmit, submitLabel = 'Save', size = 'lg' }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setValues(initial || {});
    setErrors({});
  }
  const set = (f, v) => {
    setValues((prev) => {
      const next = { ...prev, [f.name]: v };
      return f.onChangeEffect ? { ...next, ...f.onChangeEffect(v, next) } : next;
    });
    setErrors((e) => ({ ...e, [f.name]: undefined }));
  };
  const submit = (e) => {
    e?.preventDefault();
    const errs = validateFields(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const out = { ...values };
    fields.forEach((f) => { if (f.type === 'number' && out[f.name] !== '' && out[f.name] != null) out[f.name] = Number(out[f.name]); });
    onSubmit(out);
  };
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size={size}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>{submitLabel}</button></>}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5" noValidate>
        {fields.filter((f) => !f.hidden?.(values)).map((f) => (
          <Field key={f.name} f={f} value={values[f.name]} error={errors[f.name]} values={values} onChange={(v) => set(f, v)} />
        ))}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
