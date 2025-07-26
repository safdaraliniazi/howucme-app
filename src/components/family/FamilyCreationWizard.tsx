'use client';

import { useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';

interface FamilyCreationWizardProps {
  onComplete: (familyId: string) => void;
  onCancel: () => void;
}

export default function FamilyCreationWizard({ onComplete, onCancel }: FamilyCreationWizardProps) {
  const { createFamily, loading, error } = useFamilyStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    motto: '',
    values: [''],
    isPublic: false,
    maxMembers: undefined as number | undefined
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: '🏠' },
    { id: 2, title: 'Values & Motto', icon: '💝' },
    { id: 3, title: 'Settings', icon: '⚙️' },
    { id: 4, title: 'Review', icon: '✨' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData({ ...formData, values: newValues });
  };

  const addValue = () => {
    setFormData({ ...formData, values: [...formData.values, ''] });
  };

  const removeValue = (index: number) => {
    const newValues = formData.values.filter((_, i) => i !== index);
    setFormData({ ...formData, values: newValues });
  };

  const handleSubmit = async () => {
    try {
      const filteredValues = formData.values.filter(v => v.trim() !== '');
      const familyData: any = {
        name: formData.name,
        description: formData.description,
        motto: formData.motto,
        values: filteredValues,
        isPublic: formData.isPublic
      };

      // Only add maxMembers if it has a value
      if (formData.maxMembers && formData.maxMembers > 0) {
        familyData.maxMembers = formData.maxMembers;
      }

      const familyId = await createFamily(familyData);
      onComplete(familyId);
    } catch (error) {
      console.error('Error creating family:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., The Johnson Chosen Family"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your family's story, purpose, or what brings you together..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Motto
              </label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                placeholder="e.g., 'Love makes family' or 'Together we grow'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Values
              </label>
              <p className="text-sm text-gray-500 mb-3">
                What principles guide your family? Add the values that matter most to you.
              </p>
              {formData.values.map((value, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder="e.g., Kindness, Support, Authenticity"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.values.length > 1 && (
                    <button
                      onClick={() => removeValue(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {formData.values.length < 10 && (
                <button
                  onClick={addValue}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Another Value
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Family Visibility
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: false })}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Private Family</div>
                    <div className="text-sm text-gray-500">Only invited members can join</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: true })}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Public Family</div>
                    <div className="text-sm text-gray-500">Others can discover and request to join</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Members (Optional)
              </label>
              <input
                type="number"
                value={formData.maxMembers || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxMembers: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Leave empty for no limit"
                min="2"
                max="100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can always change this later
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Family</h3>
              <p className="text-gray-600">Make sure everything looks good before creating</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="font-medium text-gray-700">Family Name:</label>
                <p className="text-gray-900">{formData.name}</p>
              </div>

              {formData.description && (
                <div>
                  <label className="font-medium text-gray-700">Description:</label>
                  <p className="text-gray-900">{formData.description}</p>
                </div>
              )}

              {formData.motto && (
                <div>
                  <label className="font-medium text-gray-700">Motto:</label>
                  <p className="text-gray-900 italic">"{formData.motto}"</p>
                </div>
              )}

              {formData.values.filter(v => v.trim() !== '').length > 0 && (
                <div>
                  <label className="font-medium text-gray-700">Values:</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.values.filter(v => v.trim() !== '').map((value, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="font-medium text-gray-700">Visibility:</label>
                <p className="text-gray-900">
                  {formData.isPublic ? 'Public Family' : 'Private Family'}
                </p>
              </div>

              {formData.maxMembers && (
                <div>
                  <label className="font-medium text-gray-700">Max Members:</label>
                  <p className="text-gray-900">{formData.maxMembers}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return true; // Values and motto are optional
      case 3:
        return true; // Settings are optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Create Your Family</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="ml-2 text-sm">
                  <div className={`font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : handlePrev}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <div className="space-x-3">
            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
