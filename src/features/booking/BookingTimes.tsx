// Client time picker: compact native radio choices retain provider context and keyboard access.
"use client";
export default function BookingTimes({ options, value, onChange, label }: {
  options: Array<{ id: string; label: string; description?: string }>; value: string;
  onChange: (id: string) => void; label: string;
}) {
  return <fieldset className="booking-times"><legend>{label}</legend><div className="booking-time-grid">
    {options.map(option => <label key={option.id} className="booking-time">
      <input className="sr-only" type="radio" name="slot" value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      <span>{option.label}</span>{option.description && <small>{option.description}</small>}
    </label>)}
  </div></fieldset>;
}
