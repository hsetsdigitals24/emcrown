// Client context contract: sidebar state is independent of server-rendered workspace content.
"use client";
import { createContext } from "react";
export const WorkspaceContext = createContext({ collapsed: false, toggle: () => {} });
