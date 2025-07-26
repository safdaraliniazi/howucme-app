'use client';

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { EnhancedCommunityEvent } from '@/types';

interface CommunityCalendarProps {
  communityId: string;
  onEventSelect?: (event: EnhancedCommunityEvent) => void;
  onDateSelect?: (date: Date) => void;
}

export default function CommunityCalendar({ 
  communityId, 
  onEventSelect, 
  onDateSelect 
}: CommunityCalendarProps) {
  const {
    events,
    calendarView,
    selectedDate,
    loading,
    error,
    fetchEvents,
    setCalendarView,
    setSelectedDate,
    setSelectedEvent,
    subscribeToEvents
  } = useEventStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents(communityId);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToEvents(communityId);
    return () => unsubscribe();
  }, [communityId]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type: EnhancedCommunityEvent['type']) => {
    const colors = {
      meeting: 'bg-blue-500',
      workshop: 'bg-green-500',
      social: 'bg-purple-500',
      virtual: 'bg-cyan-500',
      hybrid: 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleEventClick = (event: EnhancedCommunityEvent) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading calendar: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Selector */}
          <div className="flex bg-gray-100 rounded-lg">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  calendarView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {calendarView === 'month' && (
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => {
              if (!date) {
                return <div key={index} className="h-24 p-1"></div>;
              }

              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`h-24 p-1 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50 border-blue-200' : ''
                  } ${
                    isSelected ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`px-1 py-0.5 text-xs rounded text-white truncate ${getEventTypeColor(event.type)}`}
                        title={`${event.title} - ${formatTime(event.dateTime)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {calendarView === 'week' && (
        <div className="p-6">
          <div className="text-center text-gray-500">
            Week view coming soon...
          </div>
        </div>
      )}

      {/* Day View */}
      {calendarView === 'day' && (
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(selectedDate || new Date())}
            </h3>
          </div>

          <div className="space-y-3">
            {getEventsForDate(selectedDate || new Date()).map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <span className="text-sm text-gray-500 capitalize">{event.type}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>🕒 {formatTime(event.dateTime)}</span>
                      {event.endDateTime && (
                        <span>- {formatTime(event.endDateTime)}</span>
                      )}
                      <span>👥 {event.attendees.length} attending</span>
                      {event.location.type === 'physical' && event.location.address && (
                        <span>📍 {event.location.address}</span>
                      )}
                      {event.location.type === 'virtual' && (
                        <span>💻 Virtual</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {getEventsForDate(selectedDate || new Date()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>No events scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">Event Types:</span>
          {[
            { type: 'meeting', label: 'Meeting' },
            { type: 'workshop', label: 'Workshop' },
            { type: 'social', label: 'Social' },
            { type: 'virtual', label: 'Virtual' },
            { type: 'hybrid', label: 'Hybrid' }
          ].map(({ type, label }) => (
            <div key={type} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${getEventTypeColor(type as EnhancedCommunityEvent['type'])}`}></div>
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
