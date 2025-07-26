import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  limit,
  getDoc,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  EnhancedCommunityEvent, 
  EventAttendee, 
  EventWaitlist,
  AppUser 
} from '@/types';

interface EventState {
  events: EnhancedCommunityEvent[];
  userEvents: EnhancedCommunityEvent[];
  selectedEvent: EnhancedCommunityEvent | null;
  calendarView: 'month' | 'week' | 'day';
  selectedDate: Date;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchEvents: (communityId?: string) => Promise<void>;
  fetchUserEvents: () => Promise<void>;
  createEvent: (eventData: Omit<EnhancedCommunityEvent, 'id' | 'createdAt' | 'updatedAt' | 'attendees' | 'waitlist'>) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<EnhancedCommunityEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  rsvpToEvent: (eventId: string, status: EventAttendee['rsvpStatus']) => Promise<void>;
  checkInToEvent: (eventId: string, userId?: string) => Promise<void>;
  joinWaitlist: (eventId: string) => Promise<void>;
  leaveWaitlist: (eventId: string) => Promise<void>;
  promoteFromWaitlist: (eventId: string, userId: string) => Promise<void>;
  setCalendarView: (view: 'month' | 'week' | 'day') => void;
  setSelectedDate: (date: Date) => void;
  setSelectedEvent: (event: EnhancedCommunityEvent | null) => void;
  subscribeToEvents: (communityId: string) => () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  userEvents: [],
  selectedEvent: null,
  calendarView: 'month',
  selectedDate: new Date(),
  loading: false,
  error: null,

  fetchEvents: async (communityId?: string) => {
    try {
      set({ loading: true, error: null });

      let q = query(
        collection(db, 'enhancedEvents'),
        limit(100)
      );

      if (communityId) {
        q = query(
          collection(db, 'enhancedEvents'),
          where('communityId', '==', communityId),
          limit(100)
        );
      }

      const querySnapshot = await getDocs(q);
      const events: EnhancedCommunityEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        events.push({
          id: doc.id,
          communityId: data.communityId,
          title: data.title,
          description: data.description,
          type: data.type,
          dateTime: data.dateTime?.toDate() || new Date(),
          endDateTime: data.endDateTime?.toDate(),
          location: data.location,
          maxAttendees: data.maxAttendees,
          attendees: data.attendees || [],
          waitlist: data.waitlist || [],
          recurring: data.recurring,
          createdBy: data.createdBy,
          tags: data.tags || [],
          isPublic: data.isPublic,
          rsvpRequired: data.rsvpRequired,
          rsvpDeadline: data.rsvpDeadline?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      // Sort by date
      events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      set({ events });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserEvents: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) return;

      set({ loading: true, error: null });

      // Fetch events where user is an attendee
      const q = query(
        collection(db, 'enhancedEvents'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const userEvents: EnhancedCommunityEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const event = {
          id: doc.id,
          communityId: data.communityId,
          title: data.title,
          description: data.description,
          type: data.type,
          dateTime: data.dateTime?.toDate() || new Date(),
          endDateTime: data.endDateTime?.toDate(),
          location: data.location,
          maxAttendees: data.maxAttendees,
          attendees: data.attendees || [],
          waitlist: data.waitlist || [],
          recurring: data.recurring,
          createdBy: data.createdBy,
          tags: data.tags || [],
          isPublic: data.isPublic,
          rsvpRequired: data.rsvpRequired,
          rsvpDeadline: data.rsvpDeadline?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };

        // Check if user is attending or on waitlist
        const isAttending = event.attendees.some((a: EventAttendee) => a.userId === currentUser.uid);
        const isOnWaitlist = event.waitlist.some((w: EventWaitlist) => w.userId === currentUser.uid);
        
        if (isAttending || isOnWaitlist || event.createdBy === currentUser.uid) {
          userEvents.push(event);
        }
      });

      // Sort by date
      userEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      set({ userEvents });
    } catch (error: any) {
      console.error('Error fetching user events:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (eventData) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to create events');
      }

      set({ loading: true, error: null });

      // Filter out undefined values
      const cleanEventData = Object.fromEntries(
        Object.entries(eventData).filter(([_, value]) => value !== undefined)
      );

      const eventDocData = {
        ...cleanEventData,
        attendees: [],
        waitlist: [],
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const eventDocRef = await addDoc(collection(db, 'enhancedEvents'), eventDocData);

      console.log('Event created with ID:', eventDocRef.id);
      
      // Refresh events
      await get().fetchEvents(eventData.communityId);
      
      return eventDocRef.id;
    } catch (error: any) {
      console.error('Error creating event:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (eventId: string, updates) => {
    try {
      set({ loading: true, error: null });

      // Filter out undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, ...updates, updatedAt: new Date() } : event
      );
      set({ events: updatedEvents });

      console.log('Event updated:', eventId);
    } catch (error: any) {
      console.error('Error updating event:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      set({ loading: true, error: null });

      await deleteDoc(doc(db, 'enhancedEvents', eventId));

      // Update local state
      const { events } = get();
      const filteredEvents = events.filter(event => event.id !== eventId);
      set({ events: filteredEvents });

      console.log('Event deleted:', eventId);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  rsvpToEvent: async (eventId: string, status: EventAttendee['rsvpStatus']) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to RSVP');
      }

      const eventDoc = await getDoc(doc(db, 'enhancedEvents', eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      let attendees = eventData.attendees || [];
      let waitlist = eventData.waitlist || [];

      // Remove user from existing attendees and waitlist
      attendees = attendees.filter((a: EventAttendee) => a.userId !== currentUser.uid);
      waitlist = waitlist.filter((w: EventWaitlist) => w.userId !== currentUser.uid);

      // Add to attendees if attending or maybe
      if (status === 'attending' || status === 'maybe') {
        const newAttendee: EventAttendee = {
          userId: currentUser.uid,
          userName: currentUser.name,
          userEmail: currentUser.email,
          rsvpStatus: status,
          rsvpAt: new Date()
        };

        // Check if event is full
        if (eventData.maxAttendees && attendees.length >= eventData.maxAttendees) {
          // Add to waitlist instead
          const waitlistEntry: EventWaitlist = {
            userId: currentUser.uid,
            userName: currentUser.name,
            userEmail: currentUser.email,
            joinedWaitlistAt: new Date(),
            position: waitlist.length + 1
          };
          waitlist.push(waitlistEntry);
        } else {
          attendees.push(newAttendee);
        }
      }

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        attendees,
        waitlist,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, attendees, waitlist } : event
      );
      set({ events: updatedEvents });

      console.log('RSVP updated for event:', eventId);
    } catch (error: any) {
      console.error('Error updating RSVP:', error);
      set({ error: error.message });
      throw error;
    }
  },

  checkInToEvent: async (eventId: string, userId?: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to check in');
      }

      const targetUserId = userId || currentUser.uid;

      const eventDoc = await getDoc(doc(db, 'enhancedEvents', eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      const attendees = eventData.attendees || [];

      const updatedAttendees = attendees.map((attendee: EventAttendee) => {
        if (attendee.userId === targetUserId) {
          return {
            ...attendee,
            checkedIn: true,
            checkedInAt: new Date()
          };
        }
        return attendee;
      });

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        attendees: updatedAttendees,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, attendees: updatedAttendees } : event
      );
      set({ events: updatedEvents });

      console.log('Checked in to event:', eventId);
    } catch (error: any) {
      console.error('Error checking in to event:', error);
      set({ error: error.message });
      throw error;
    }
  },

  joinWaitlist: async (eventId: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in to join waitlist');
      }

      const eventDoc = await getDoc(doc(db, 'enhancedEvents', eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      let waitlist = eventData.waitlist || [];

      // Check if user is already on waitlist
      if (waitlist.some((w: EventWaitlist) => w.userId === currentUser.uid)) {
        throw new Error('Already on waitlist');
      }

      const waitlistEntry: EventWaitlist = {
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        joinedWaitlistAt: new Date(),
        position: waitlist.length + 1
      };

      waitlist.push(waitlistEntry);

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        waitlist,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, waitlist } : event
      );
      set({ events: updatedEvents });

      console.log('Joined waitlist for event:', eventId);
    } catch (error: any) {
      console.error('Error joining waitlist:', error);
      set({ error: error.message });
      throw error;
    }
  },

  leaveWaitlist: async (eventId: string) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().appUser;
      
      if (!currentUser) {
        throw new Error('Must be logged in');
      }

      const eventDoc = await getDoc(doc(db, 'enhancedEvents', eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      let waitlist = eventData.waitlist || [];

      // Remove user from waitlist and update positions
      waitlist = waitlist
        .filter((w: EventWaitlist) => w.userId !== currentUser.uid)
        .map((w: EventWaitlist, index: number) => ({
          ...w,
          position: index + 1
        }));

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        waitlist,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, waitlist } : event
      );
      set({ events: updatedEvents });

      console.log('Left waitlist for event:', eventId);
    } catch (error: any) {
      console.error('Error leaving waitlist:', error);
      set({ error: error.message });
      throw error;
    }
  },

  promoteFromWaitlist: async (eventId: string, userId: string) => {
    try {
      const eventDoc = await getDoc(doc(db, 'enhancedEvents', eventId));
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      let attendees = eventData.attendees || [];
      let waitlist = eventData.waitlist || [];

      // Find user in waitlist
      const waitlistUser = waitlist.find((w: EventWaitlist) => w.userId === userId);
      if (!waitlistUser) {
        throw new Error('User not found in waitlist');
      }

      // Check if event still has space
      if (eventData.maxAttendees && attendees.length >= eventData.maxAttendees) {
        throw new Error('Event is still full');
      }

      // Move user from waitlist to attendees
      const newAttendee: EventAttendee = {
        userId: waitlistUser.userId,
        userName: waitlistUser.userName,
        userEmail: waitlistUser.userEmail,
        rsvpStatus: 'attending',
        rsvpAt: new Date()
      };

      attendees.push(newAttendee);
      waitlist = waitlist
        .filter((w: EventWaitlist) => w.userId !== userId)
        .map((w: EventWaitlist, index: number) => ({
          ...w,
          position: index + 1
        }));

      await updateDoc(doc(db, 'enhancedEvents', eventId), {
        attendees,
        waitlist,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const { events } = get();
      const updatedEvents = events.map(event =>
        event.id === eventId ? { ...event, attendees, waitlist } : event
      );
      set({ events: updatedEvents });

      console.log('Promoted user from waitlist:', userId);
    } catch (error: any) {
      console.error('Error promoting from waitlist:', error);
      set({ error: error.message });
      throw error;
    }
  },

  setCalendarView: (view) => {
    set({ calendarView: view });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },

  subscribeToEvents: (communityId: string) => {
    const q = query(
      collection(db, 'enhancedEvents'),
      where('communityId', '==', communityId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: EnhancedCommunityEvent[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        events.push({
          id: doc.id,
          communityId: data.communityId,
          title: data.title,
          description: data.description,
          type: data.type,
          dateTime: data.dateTime?.toDate() || new Date(),
          endDateTime: data.endDateTime?.toDate(),
          location: data.location,
          maxAttendees: data.maxAttendees,
          attendees: data.attendees || [],
          waitlist: data.waitlist || [],
          recurring: data.recurring,
          createdBy: data.createdBy,
          tags: data.tags || [],
          isPublic: data.isPublic,
          rsvpRequired: data.rsvpRequired,
          rsvpDeadline: data.rsvpDeadline?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      // Sort by date
      events.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      set({ events });
    });

    return unsubscribe;
  }
}));
