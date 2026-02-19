import React, { useState } from 'react';
import { ChevronRight, Heart, Calendar, Clock, DollarSign } from 'lucide-react';
import type { BookingPreferences, AvailabilityWindow } from '@/types/dtos/intake-form.dto';
import type { SuggestedTherapist } from '@/types/dtos/therapist-suggestion.dto';
import { useNavigate } from 'react-router-dom';

interface BookingFlowProps {
  therapists: SuggestedTherapist[];
  onBookingComplete: (preferences: BookingPreferences, selectedTherapistId: string) => void;
  onCancel: () => void;
}

type BookingStep = 'confirmation' | 'preferences' | 'success';

const BookingFlow: React.FC<BookingFlowProps> = ({
  therapists,
  onBookingComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<BookingStep>('confirmation');
  const [selectedTherapistId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<BookingPreferences>({
    budget: null,
    availability: [],
  });
  const [bookingData, setBookingData] = useState<{
    therapistName: string;
    appointmentDateTime: string;
    mode: 'video' | 'in_person';
    sessionFee: number;
  } | null>(null);

  const primaryTherapist = therapists[0];
  const alternativeTherapists = therapists.slice(1, 3);
  const navigate = useNavigate();

  const handleConfirmBooking = () => {
    if (primaryTherapist) {
      // Go directly to therapist detail page to show full slot picker and booking flow
      navigate(`/therapists/${primaryTherapist._id}`);
    }
  };

  const handleSelectAlternative = (therapistId: string) => {
    // Navigate to the selected alternative therapist's detail page
    navigate(`/therapists/${therapistId}`);
  };

  const toggleAvailability = (window: AvailabilityWindow) => {
    setPreferences((prev) => ({
      ...prev,
      availability: prev.availability.includes(window)
        ? prev.availability.filter((a) => a !== window)
        : [...prev.availability, window],
    }));
  };

  const handleCompleteBooking = () => {
    if (selectedTherapistId && preferences.budget && preferences.availability.length > 0) {
      // Simulate booking confirmation
      const therapist = therapists.find((t) => t._id === selectedTherapistId);
      setBookingData({
        therapistName: therapist?.name || 'Therapist',
        appointmentDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        mode: 'video',
        sessionFee: parseInt(preferences.budget.split('_')[0]) || 1500,
      });
      setStep('success');
      onBookingComplete(preferences, selectedTherapistId);
    }
  };

  const isPreferencesComplete = () => {
    return preferences.budget !== null && preferences.availability.length > 0;
  };

  if (step === 'confirmation') {
    return (
      <div className="w-full space-y-6">
        <div className="text-sm text-gray-600 font-medium">
          Step 3 of 3: Therapist Confirmation & Booking
        </div>

        {/* Empathetic message */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-900 font-medium">
            ✨ Based on what you've shared, this therapist would be a great fit for you.
          </p>
        </div>

        {/* Primary Therapist */}
        {primaryTherapist && (
          <div className="bg-white border-2 border-emerald-300 rounded-lg p-5 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{primaryTherapist.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {primaryTherapist.experienceYears}+ years experience
                </p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {Math.round(primaryTherapist.matchScore * 100)}% match
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Specializations:</p>
              <div className="flex flex-wrap gap-2">
                {primaryTherapist.specializations.slice(0, 4).map((spec, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-1">Languages:</p>
              <p className="text-sm text-gray-700">{primaryTherapist.languages.join(', ')}</p>
            </div>

            {primaryTherapist.fee && (
              <p className="text-sm text-gray-700 mb-4">
                <span className="font-semibold">Session Fee:</span> ₹{primaryTherapist.fee}
              </p>
            )}

            <button
              onClick={handleConfirmBooking}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              Yes, please book it
            </button>
          </div>
        )}

        {/* Alternative Therapists */}
        {alternativeTherapists.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Or explore alternatives:</p>
            {alternativeTherapists.map((therapist) => (
              <div
                key={therapist._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{therapist.name}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {therapist.experienceYears}+ years experience
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {Math.round(therapist.matchScore * 100)}% match
                  </span>
                </div>
                <button
                  onClick={() => handleSelectAlternative(therapist._id)}
                  className="w-full bg-white border border-emerald-600 text-emerald-600 py-2 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
                >
                  Choose this therapist
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cancel option */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            I'd like to choose later
          </button>
        </div>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="w-full space-y-6">
        <div className="text-sm text-gray-600 font-medium">
          Finalizing Your Booking
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-900">
            ✨ Great! Let me collect a couple of details to find the perfect time for your first session.
          </p>
        </div>

        {/* Budget Selection */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              What's your preferred budget per session?
            </h4>
          </div>
          <div className="space-y-2">
            {[
              { value: 'under_1500' as const, label: 'Under ₹1500', desc: 'Budget-friendly' },
              { value: '1500_2000' as const, label: '₹1500 – ₹2000', desc: 'Mid-range' },
              { value: 'over_2000' as const, label: 'Over ₹2000', desc: 'Premium' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences((prev) => ({ ...prev, budget: option.value }))}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  preferences.budget === option.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Availability Selection */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              When are you generally available for sessions?
            </h4>
            <p className="text-xs text-gray-600">Select all that apply</p>
          </div>
          <div className="space-y-2">
            {[
              { value: 'weekday_mornings', label: '🌅 Weekday mornings (Mon-Fri, 6am-12pm)' },
              { value: 'weekday_evenings', label: '🌆 Weekday evenings (Mon-Fri, 5pm-9pm)' },
              { value: 'weekend_mornings', label: '☀️ Weekend mornings (Sat-Sun, 8am-12pm)' },
              { value: 'weekend_afternoons', label: '🌤️ Weekend afternoons (Sat-Sun, 1pm-5pm)' },
              { value: 'any_time', label: '⏰ Any time works for me' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => toggleAvailability(option.value as AvailabilityWindow)}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                  preferences.availability.includes(option.value as AvailabilityWindow)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <span className="font-medium text-gray-900">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between pt-4">
          <button
            onClick={() => setStep('confirmation')}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleCompleteBooking}
            disabled={!isPreferencesComplete()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            Complete Booking
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success' && bookingData) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="text-5xl">🤍</div>
          <h3 className="text-2xl font-bold text-gray-900">You're all set!</h3>
          <p className="text-gray-600">
            I've booked your session with {bookingData.therapistName}.
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <span className="font-semibold text-sm">👤</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Therapist</p>
              <p className="text-gray-900 font-semibold">{bookingData.therapistName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Date & Time</p>
              <p className="text-gray-900 font-semibold">
                {new Date(bookingData.appointmentDateTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(bookingData.appointmentDateTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <span className="font-semibold text-sm">📹</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Mode</p>
              <p className="text-gray-900 font-semibold capitalize">{bookingData.mode}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Session Fee</p>
              <p className="text-gray-900 font-semibold">₹{bookingData.sessionFee}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">📧 Next Steps:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Check your email for appointment details</li>
            <li>✓ You'll receive a video link 15 minutes before the session</li>
            <li>✓ You can reschedule or cancel anytime</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/appointments'}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            View Appointment Details
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BookingFlow;
