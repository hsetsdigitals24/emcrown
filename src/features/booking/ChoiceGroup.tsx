// Client presentation: native radio choices provide keyboard selection and blue states.
"use client";
export default function ChoiceGroup({ name, legend, options, value, onChange }: {
  name: string; legend: string; options: Array<{ id: string; label: string; description?: string }>;
  value: string; onChange: (id: string) => void;
}) {
  return <fieldset className="booking-choice-group"><legend className="booking-legend">{legend}</legend>
    <div className="booking-options">{options.map((option) => <label key={option.id} className="booking-option">
      <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      <span className="booking-option-content"><span className="font-heading text-xl text-primary">{option.label}</span>{option.description && <span className="text-sm text-textSecondary">{option.description}</span>}</span>
    </label>)}</div>
  </fieldset>;
}
