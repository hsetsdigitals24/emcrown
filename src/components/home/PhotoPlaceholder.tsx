// Server component: honest, decorative photo frames until approved imagery arrives.
export default function PhotoPlaceholder({ label, room = false }: { label: string; room?: boolean }) {
  return <div className={`photo-placeholder ${room ? "photo-room" : "photo-portrait"}`}>
    {room && <div className="room-illustration" aria-hidden="true"><div className="room-window" /><div className="room-bench" /><div className="room-plant" /></div>}
    {!room && <div className="portrait-outline" aria-hidden="true" />}
    <span className="photo-label">{label}</span>
  </div>;
}
