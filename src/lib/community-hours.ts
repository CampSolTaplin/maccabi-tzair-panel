import { SOMAttendanceData, CommunityEvent } from '@/types';

export interface MemberHours {
  contactId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  /** Hours from regular Wed+Sat sessions (2h per full attendance, 1h per late) */
  regularHours: number;
  /** Number of regular sessions attended (full) */
  regularSessions: number;
  /** Number of regular sessions attended late */
  lateSessions: number;
  /** Hours from special community events */
  eventHours: number;
  /** Breakdown of event hours */
  eventBreakdown: { eventName: string; hours: number }[];
  /** Total community hours */
  totalHours: number;
}

/**
 * Computes community hours for all members.
 *
 * Regular sessions: present = 2 community hours per session
 * Events: realHours × multiplier for each attended event
 */
export function computeAllMemberHours(
  attendance: SOMAttendanceData | null,
  events: CommunityEvent[],
): MemberHours[] {
  if (!attendance) return [];

  return attendance.members.map(member => {
    // Regular session hours
    let regularSessions = 0;
    let lateSessions = 0;
    const rec = attendance.records[member.contactId] || {};
    for (const d of attendance.dates) {
      if (rec[d] === true) regularSessions++;
      else if (rec[d] === 'late') lateSessions++;
    }
    const regularHours = (regularSessions * 2) + (lateSessions * 1); // 2h per full, 1h per late

    // Event hours
    let eventHours = 0;
    const eventBreakdown: { eventName: string; hours: number }[] = [];
    for (const evt of events) {
      if (evt.attendees.includes(member.contactId)) {
        const hours = evt.realHours * evt.multiplier;
        eventHours += hours;
        eventBreakdown.push({ eventName: evt.name, hours });
      }
    }

    return {
      contactId: member.contactId,
      fullName: member.fullName,
      firstName: member.firstName,
      lastName: member.lastName,
      regularHours,
      regularSessions,
      lateSessions,
      eventHours,
      eventBreakdown,
      totalHours: regularHours + eventHours,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Compute hours for a single member (for letter generation)
 */
export function computeMemberHours(
  contactId: string,
  attendance: SOMAttendanceData | null,
  events: CommunityEvent[],
): MemberHours | null {
  const all = computeAllMemberHours(attendance, events);
  return all.find(m => m.contactId === contactId) || null;
}
