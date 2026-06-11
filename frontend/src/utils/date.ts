import { Note } from '@/types/note';

export const getLocalDateString = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown Date';
  // Return YYYY-MM-DD for grouping key
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatGroupDate = (dateStr: string) => {
  if (dateStr === 'Unknown Date') return 'Drafts & Processing';
  const date = new Date(dateStr);
  const today = new Date();
  
  // Compare dates ignoring time
  const dString = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const tString = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yString = tString - 24 * 60 * 60 * 1000;

  const formatted = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (dString === tString) {
    return `Today — ${formatted}`;
  } else if (dString === yString) {
    return `Yesterday — ${formatted}`;
  }
  return formatted;
};

export interface GroupedNotes {
  dateKey: string;
  label: string;
  notes: Note[];
}

export function groupNotesByDate(notes: Note[]): GroupedNotes[] {
  const groups: Record<string, Note[]> = {};
  
  notes.forEach((note) => {
    const dateKey = note.createdAt ? getLocalDateString(note.createdAt) : 'Unknown Date';
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(note);
  });

  // Sort the date keys descending (newest first)
  return Object.keys(groups)
    .sort((a, b) => {
      if (a === 'Unknown Date') return 1; // Put Unknown Date at the end
      if (b === 'Unknown Date') return -1;
      return b.localeCompare(a);
    })
    .map((dateKey) => ({
      dateKey,
      label: formatGroupDate(dateKey),
      notes: groups[dateKey],
    }));
}
