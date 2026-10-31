// Shared activity filter policy and editable monitoring labels.
export const ACTIVITY_POLICY = { pageSize: 25, maxPage: 100000, routineActions: ["portal.viewed", "audit.viewed"] } as const;
export const ACTIVITY_COPY = {
  title: "Filter activity", scope: "Account, security and workspace-access events. Filters search stored organisation history, not just this page. Dates and times use UTC.",
  period: "Time period", periods: { all: "All time", today: "Today (UTC)", day: "Last 24 hours", week: "Last 7 days", month: "Last 30 days", custom: "Custom dates" },
  from: "From date (UTC)", to: "Through date (UTC)", datesHelp: "Choose Custom dates to use these fields. The through date is included.",
  category: "Activity category", categories: { all: "All categories", auth: "Sign-in & security", access: "Workspace access", members: "Staff invitations", ownership: "Ownership", organisation: "Organisation setup" },
  action: "Specific activity", allActions: "All activities", result: "Result", outcomes: { all: "All results", attention: "Unsuccessful or blocked", success: "Completed", failure: "Unsuccessful", denied: "Blocked" },
  role: "Recorded role", roles: { all: "All roles", super_admin: "Super admin", admin: "Admin", staff: "Staff", unknown: "No recorded role" },
  unidentified: "Not identified", noRole: "Not recorded",
  actor: "Recorded actor", actors: { all: "All actors", mine: "My activity", unknown: "No identified actor" },
  advanced: "Dates and exact actor ID", actorId: "Exact actor ID", actorHelp: "Optional: paste a full actor ID from a log entry. Use All actors with this field. Unsuccessful attempts may have no identified actor or role.",
  actorPlaceholder: "Full UUID from a log entry", hideRoutine: "Hide routine workspace and log views", apply: "Apply filters", reset: "Clear filters", refresh: "Refresh results",
  quick: "Quick views", attention: "Needs attention", today: "Today", recent: "Last 7 days", mine: "My activity", security: "Security events",
  total: "Matching events", success: "Completed", failure: "Unsuccessful", denied: "Blocked",
  invalid: "Some filters are invalid. Check dates, actor ID and selections, or clear the filters. No unfiltered results are shown.",
  empty: "No events match these filters.", emptyHelp: "Try a wider date range or clear a filter. Unidentified actors are not attributed to a staff account.",
  snapshot: "Results as of", snapshotHelp: "New events appear when you refresh or apply filters. Pagination keeps this snapshot stable.",
  page: "Page", of: "of", previous: "Newer events", next: "Older events", pagination: "Activity pages", results: "Activity results",
};
