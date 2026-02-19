import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, Users, Star, FileText, MapPin, Eye, CalendarX, Stethoscope, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useParams } from 'react-router-dom';
import { S3BucketUtil } from '@/utils/S3Bucket.util';
import { getUserDetails } from '@/services/admin/clientServices';
import type { User } from '@/types/dtos/user.dto';


const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  
  type UserWithDetails = User & {
    phone?: string | null;
    dob?: string | null;
    gender?: string | null;
    createdAt?: string | null;
  };

  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface SessionEntry {
    id: string;
    therapistPhoto: string;
    therapistName: string;
    dateTime: string;
    duration: string;
    reason?: string;
    issue: string;
    mode: string;
    fee: string;
    rating: number;
    userFeedback: string;
    doctorNotes: string;
  }

  const [selectedSession, setSelectedSession] = useState<SessionEntry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) {
        setError('User ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserDetails(userId);
        setUser(userData as UserWithDetails);
        
        if (userData.profileImg) {
          try {
            const fileUrl = await S3BucketUtil.getPreSignedURL(userData.profileImg);
            setSignedImageUrl(fileUrl);
          } catch (error) {
            console.error('Failed to get signed URL:', error);
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching user details:', err);
        const message = err instanceof Error ? err.message : 'Failed to load user details';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const getUserInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return 'N/A';
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const ProfilePicture = ({
    firstName,
    lastName,
    size = 'w-20 h-20',
    textSize = 'text-xl',
  }: {
    firstName: string;
    lastName: string;
    size?: string;
    textSize?: string;
  }) => {
    const initials = getUserInitials(firstName, lastName);

    if (!signedImageUrl) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${textSize} shadow-lg`}>
          {initials}
        </div>
      );
    }

    return (
      <img
        src={signedImageUrl}
        alt=""
        className={`${size} rounded-full object-cover shadow-lg`}
      />
    );
  };

  const SmallProfilePicture = ({
    src,
    firstName,
    lastName,
    size = 'w-10 h-10',
    textSize = 'text-sm',
  }: {
    src?: string;
    firstName: string;
    lastName: string;
    size?: string;
    textSize?: string;
  }) => {
    const [imageError, setImageError] = useState(false);
    const initials = getUserInitials(firstName, lastName);

    if (!src || imageError) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold ${textSize}`}>
          {initials}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt="Profile"
        className={`${size} rounded-full object-cover`}
        onError={() => setImageError(true)}
      />
    );
  };

  const sessionHistory: SessionEntry[] = [];
  const upcomingSessions: SessionEntry[] = [];

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Phone className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'video': return 'bg-blue-100 text-blue-600';
      case 'audio': return 'bg-green-100 text-green-600';
      case 'in-person': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getIssueColor = (issue: string) => {
    switch (issue.toLowerCase()) {
      case 'anxiety': return 'bg-red-50 text-red-700';
      case 'depression': return 'bg-orange-50 text-orange-700';
      case 'stress management': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const openSheet = (session: SessionEntry) => {
    setSelectedSession(session);
    setIsSheetOpen(true);
  };

  const EmptyUpcomingSessions = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
        <CalendarX className="w-10 h-10 text-blue-500" />
      </div>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">No Upcoming Sessions</h4>
      <p className="text-gray-500 text-center text-sm leading-relaxed">
        This client does not have any upcoming sessions.
      </p>
    </div>
  );

  const EmptySessionHistory = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
        <Stethoscope className="w-12 h-12 text-purple-500" />
      </div>
      <h4 className="text-xl font-semibold text-gray-700 mb-3">No Sessions Yet</h4>
      <p className="text-gray-500 text-center text-sm leading-relaxed max-w-sm">
        This client hasn't attended any therapy sessions yet. 
        Once they complete their first session, the history will appear here.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The user you are looking for does not exist.'}</p>
          {/* <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          {/* <button
            onClick={() => navigate('/admin/users')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Users
          </button> */}
          <h1 className="text-2xl font-bold text-left text-gray-900 mb-1">User Details</h1>
          <p className="text-gray-500 text-left">Comprehensive client information and session management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{sessionHistory.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600">{sessionHistory.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Upcoming</p>
                <p className="text-2xl font-bold text-orange-600">{upcomingSessions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile and Upcoming Sessions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex justify-center">
                <ProfilePicture 
                  firstName={user.firstName} 
                  lastName={user.lastName}
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full mt-2 capitalize">
                {user.role || 'Patient'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 text-sm">{user.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900 text-sm">{user.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Age</span>
                <span className="text-gray-900 text-sm">{calculateAge(user.dob)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Date of Birth</span>
                <span className="text-gray-900 text-sm">{formatDate(user.dob)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Gender</span>
                <span className="text-gray-900 text-sm capitalize">{user.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Join Date</span>
                <span className="text-gray-900 text-sm">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  user.status?.toLowerCase() === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {upcomingSessions.length === 0 ? (
              <EmptyUpcomingSessions />
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <SmallProfilePicture 
                        src={session.therapistPhoto}
                        firstName={session.therapistName.split(' ')[1]}
                        lastName={session.therapistName.split(' ')[2]}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{session.reason || session.issue}</h4>
                        <p className="text-sm text-gray-500">{session.therapistName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{session.dateTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getModeColor(session.mode)}`}>
                        {getModeIcon(session.mode)}
                        {session.mode}
                      </span>
                      <span className="text-sm text-gray-500">{session.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session History - Full Width */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {sessionHistory.length === 0 ? (
            <EmptySessionHistory />
          ) : (
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session History</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Therapist</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Date & Time</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Issue</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Mode</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <SmallProfilePicture 
                            src={session.therapistPhoto}
                            firstName={session.therapistName.split(' ')[1]}
                            lastName={session.therapistName.split(' ')[2]}
                            size="w-8 h-8"
                            textSize="text-xs"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{session.therapistName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-700">{session.dateTime}</td>
                      <td className="py-4 px-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getIssueColor(session.issue)}`}>
                          {session.issue}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getModeColor(session.mode)}`}>
                          {getModeIcon(session.mode)}
                          {session.mode}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <button
                          onClick={() => openSheet(session)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              setSelectedSession(null);
            }
          }}
        >
          <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-white">
            <div className="p-6 border-b border-gray-300">
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-gray-900">Session Details</SheetTitle>
                <SheetDescription className="text-gray-600 mt-1">
                  Complete information about the therapy session
                </SheetDescription>
              </SheetHeader>
            </div>
            
            {selectedSession && (
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                {/* Session Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <SmallProfilePicture 
                        src={selectedSession.therapistPhoto}
                        firstName={selectedSession.therapistName.split(' ')[1]}
                        lastName={selectedSession.therapistName.split(' ')[2]}
                        size="w-14 h-14"
                        textSize="text-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{selectedSession.therapistName}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{selectedSession.dateTime}</span>
                        <span className="text-gray-400">•</span>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{selectedSession.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getIssueColor(selectedSession.issue)}`}>
                          {selectedSession.issue}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(selectedSession.mode)}`}>
                          {getModeIcon(selectedSession.mode)}
                          {selectedSession.mode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Fee Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">Session Fee</h4>
                      <p className="text-sm text-gray-600 mt-1">Total consultation cost</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">{selectedSession.fee}</span>
                      <p className="text-xs text-green-700">Paid</p>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Session Rating
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${i < selectedSession.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">({selectedSession.rating}/5)</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {selectedSession.rating === 5 ? 'Excellent' : 
                       selectedSession.rating === 4 ? 'Very Good' : 
                       selectedSession.rating === 3 ? 'Good' : 
                       selectedSession.rating === 2 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                </div>

                {/* Patient Feedback */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Patient Feedback
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <p className="text-gray-700 leading-relaxed italic">"{selectedSession.userFeedback}"</p>
                  </div>
                </div>

                {/* Doctor's Notes */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Doctor's Notes
                  </h4>
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                    <p className="text-gray-700 leading-relaxed">{selectedSession.doctorNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default UserDetailPage;