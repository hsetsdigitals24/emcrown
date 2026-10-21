// Client component: eligible placeholder physicians and configurable practice location.
"use client";
import ChoiceGroup from "@/features/booking/ChoiceGroup";
import type { BookingSelection, BookingSettings } from "@/types/booking";
import type { PracticeLocation } from "@/types/public";
import type { BookingCopy } from "@/config/booking-copy";
export default function ProviderStep({ selection, settings, locations, copy, onProvider, onLocation }: {
  selection: BookingSelection; settings: BookingSettings; locations: PracticeLocation[]; copy: BookingCopy;
  onProvider: (id: string) => void; onLocation: (id: string) => void;
}) {
  const eligible = settings.types.find((item) => item.id === selection.typeId)?.providerIds ?? [];
  const options = [{ id: settings.firstAvailableId, label: copy.firstAvailable, description: copy.firstAvailableDescription },
    ...settings.providers.filter((provider) => eligible.includes(provider.id)).map((provider) => ({ id: provider.id, label: provider.label, description: provider.specialty }))];
  return <div className="space-y-6"><ChoiceGroup name="provider" legend={copy.steps[1].label} options={options} value={selection.providerId} onChange={onProvider} />
    {locations.length > 1 && <label className="booking-field" htmlFor="booking-location">{copy.location}<select id="booking-location" value={selection.locationId} onChange={(event) => onLocation(event.target.value)}>
      {locations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
    </select></label>}
  </div>;
}
