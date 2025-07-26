'use client';

import { useState } from 'react';

export default function RelationshipInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Info Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Relationship System Guide</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What are Relationships?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Relationships allow you to build your chosen family on Howucme. Connect with people who matter to you 
                  and define your unique bond with custom labels like "Best Friend," "Mentor," or "Brother."
                </p>
              </div>

              {/* How it Works */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Search for People</h4>
                      <p className="text-gray-600 text-sm">Use the "Find People" tab to search for users by name or email.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Send a Request</h4>
                      <p className="text-gray-600 text-sm">Click "Connect" and choose a relationship label that describes your bond.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900">Accept & Connect</h4>
                      <p className="text-gray-600 text-sm">Once they accept, you'll both appear in each other's relationships list.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Relationship Labels */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Relationship Labels</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Brother', 'Sister', 'Best Friend', 'Close Friend', 'Mentor', 'Student', 
                    'Cousin', 'Uncle', 'Aunt', 'Grandparent', 'Partner', 'Colleague'
                  ].map((label) => (
                    <div key={label} className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm text-center">
                      {label}
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Choose the label that best describes your relationship. This helps both of you remember your special connection.
                </p>
              </div>

              {/* Privacy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy & Safety</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start space-x-2">
                      <span>•</span>
                      <span>Only you can see your relationships list</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>•</span>
                      <span>You control who can send you requests</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>•</span>
                      <span>You can decline or remove relationships anytime</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span>•</span>
                      <span>Both people must agree to form a relationship</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Build Relationships?</h3>
                <div className="space-y-2 text-gray-600">
                  <p className="flex items-center space-x-2">
                    <span className="text-purple-500">💝</span>
                    <span>Build your chosen family and strengthen bonds</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-blue-500">🌟</span>
                    <span>See posts from people who matter most to you</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-green-500">🤝</span>
                    <span>Create meaningful connections beyond social media</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span className="text-yellow-500">✨</span>
                    <span>Celebrate your unique relationships with custom labels</span>
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Start?</h3>
                <p className="text-gray-600 mb-4">Begin building your chosen family today!</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Let's Connect!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
