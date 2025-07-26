'use client';

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { EnhancedCommunityEvent } from '@/types';

interface EventCreationWizardProps {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: EnhancedCommunityEvent) => void;
  selectedDate?: Date;
}

export default function EventCreationWizard({
  communityId,
  isOpen,
  onClose,
  onEventCreated,
  selectedDate
}: EventCreationWizardProps) {
  const { user } = useAuthStore();
  const { createEvent, loading, events } = useEventStore();

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: 'meeting' as EnhancedCommunityEvent['type'],
    dateTime: selectedDate || new Date(),
    endDateTime: undefined as Date | undefined,
    location: {
      type: 'physical' as 'physical' | 'virtual' | 'hybrid',
      address: '',
      virtualLink: ''
    },
    maxAttendees: 0,
    isPrivate: false,
    tags: [] as string[],
    recurring: {
      enabled: false,
      frequency: 'weekly' as 'weekly' | 'monthly' | 'custom',
      interval: 1,
      endDate: undefined as Date | undefined
    },
    isPublic: true,
    rsvpRequired: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedDate) {
      setEventData(prev => ({ ...prev, dateTime: selectedDate }));
    }
  }, [selectedDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!eventData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    if (!eventData.description.trim()) {
      newErrors.description = 'Event description is required';
    }
    if (eventData.endDateTime && eventData.endDateTime <= eventData.dateTime) {
      newErrors.endDateTime = 'End time must be after start time';
    }
    if (eventData.location.type === 'physical' && !eventData.location.address.trim()) {
      newErrors.address = 'Address is required for physical events';
    }
    if ((eventData.location.type === 'virtual' || eventData.location.type === 'hybrid') && 
        !eventData.location.virtualLink.trim()) {
      newErrors.virtualLink = 'Virtual link is required';
    }
    if (eventData.maxAttendees < 0) {
      newErrors.maxAttendees = 'Capacity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      const eventId = await createEvent({
        ...eventData,
        communityId,
        createdBy: user.uid
      });

      // Find the created event in the store
      const createdEvent = events.find((e: EnhancedCommunityEvent) => e.id === eventId);
      if (createdEvent) {
        onEventCreated?.(createdEvent);
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const resetForm = () => {
    setEventData({
      title: '',
      description: '',
      type: 'meeting',
      dateTime: selectedDate || new Date(),
      endDateTime: undefined,
      location: {
        type: 'physical',
        address: '',
        virtualLink: ''
      },
      maxAttendees: 0,
      isPrivate: false,
      tags: [],
      recurring: {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: undefined
      },
      isPublic: true,
      rsvpRequired: false
    });
    setErrors({});
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !eventData.tags.includes(tag.trim())) {
      setEventData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setEventData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={eventData.type}
              onChange={(e) => setEventData(prev => ({ 
                ...prev, 
                type: e.target.value as EnhancedCommunityEvent['type'] 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="meeting">Meeting</option>
              <option value="workshop">Workshop</option>
              <option value="social">Social Event</option>
              <option value="virtual">Virtual Event</option>
              <option value="hybrid">Hybrid Event</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={eventData.description}
              onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your event"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={eventData.dateTime.toISOString().slice(0, 16)}
                onChange={(e) => setEventData(prev => ({ 
                  ...prev, 
                  dateTime: new Date(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={eventData.endDateTime?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setEventData(prev => ({ 
                  ...prev, 
                  endDateTime: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDateTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDateTime && <p className="text-red-500 text-sm mt-1">{errors.endDateTime}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Type
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { value: 'physical', label: 'Physical', icon: '📍' },
                { value: 'virtual', label: 'Virtual', icon: '💻' },
                { value: 'hybrid', label: 'Hybrid', icon: '🔀' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEventData(prev => ({
                    ...prev,
                    location: { ...prev.location, type: option.value as any }
                  }))}
                  className={`p-3 border rounded-lg text-center ${
                    eventData.location.type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {(eventData.location.type === 'physical' || eventData.location.type === 'hybrid') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={eventData.location.address}
                  onChange={(e) => setEventData(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event address"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            )}

            {(eventData.location.type === 'virtual' || eventData.location.type === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Virtual Link *
                </label>
                <input
                  type="url"
                  value={eventData.location.virtualLink}
                  onChange={(e) => setEventData(prev => ({
                    ...prev,
                    location: { ...prev.location, virtualLink: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.virtualLink ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://zoom.us/j/123456789"
                />
                {errors.virtualLink && <p className="text-red-500 text-sm mt-1">{errors.virtualLink}</p>}
              </div>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity (0 = unlimited)
            </label>
            <input
              type="number"
              min="0"
              value={eventData.maxAttendees}
              onChange={(e) => setEventData(prev => ({ 
                ...prev, 
                maxAttendees: parseInt(e.target.value) || 0 
              }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxAttendees ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.maxAttendees && <p className="text-red-500 text-sm mt-1">{errors.maxAttendees}</p>}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={eventData.isPrivate}
                onChange={(e) => setEventData(prev => ({ 
                  ...prev, 
                  isPrivate: e.target.checked,
                  isPublic: !e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                Private Event (only visible to invited members)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rsvpRequired"
                checked={eventData.rsvpRequired}
                onChange={(e) => setEventData(prev => ({ 
                  ...prev, 
                  rsvpRequired: e.target.checked 
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rsvpRequired" className="ml-2 text-sm text-gray-700">
                Require RSVP for attendance
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {eventData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a tag and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
