/**
 * Browser-first keyboard shortcut classifier.
 * Modifier shortcuts work on both macOS and Windows/Linux.
 */
export function getWebShortcut(event) {
 if (!event || event.isComposing || event.repeat) return null;
 if (event.key === "Escape") return "dismiss";
 if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
 const key=typeof event.key==="string"?event.key.toLowerCase():"";
 if (key==="k"&&!event.shiftKey) return "search";
 if (key==="o"&&event.shiftKey) return "new-chat";
 return null;
}
