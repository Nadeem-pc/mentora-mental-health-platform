import React, { useState, useEffect } from 'react';
import { Phone, Award, FileText, Languages, Briefcase, User, Loader2, IndianRupee, CheckCircle2, Clock, XCircle, AlertCircle, ChevronLeft, ChevronRight, Mail, Edit, X, Upload, Trash2 } from 'lucide-react';
import { therapistProfileService } from '@/services/therapist/profileService';
import { axiosInstance } from '@/config/axios.config';

interface TherapistProfile {
  profileImg: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: string | null;
  experience: string | null;
  fee: string | null;
  qualification: string | null;
  specializations: string[];
  languages: string[];
  about: string | null;
  resume: string | null;
  certifications: string[];
  email: string;
  approvalStatus: 'Pending' | 'Requested' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
}

type ProfileUpdatePayload = {
  phone: string;
  gender: string;
  experience: string;
  fee: string;
  qualification: string;
  specializations: string[];
  languages: string[];
  about: string;
  profileImg?: string;
  resume?: string;
  certifications?: string[];
};

const TherapistProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [profileImgUrl, setProfileImgUrl] = useState<string>('');
  const [certificateUrls, setCertificateUrls] = useState<string[]>([]);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [currentCertIndex, setCurrentCertIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    gender: '',
    experience: '',
    fee: '',
    qualification: '',
    specializations: [] as string[],
    languages: [] as string[],
    about: '',
  });

  const [specializationInput, setSpecializationInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  
  const [profileImgFile, setProfileImgFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [profileImgPreview, setProfileImgPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const getPreSignedURL = async (fileName: string) => {
    try {
      const response = await axiosInstance.get('/therapist/s3-getPresigned-url', {
        params: { key: fileName },
      });
      return response.data.get_fileURL;
    } catch (error) {
      console.error('Error getting pre-signed URL:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await therapistProfileService.getProfile();
      const profileData = response.data;
      setProfile(profileData);
      setError(null);

      setFormData({
        phone: profileData?.phone || '',
        gender: profileData?.gender || '',
        experience: profileData?.experience || '',
        fee: profileData?.fee || '',
        qualification: profileData?.qualification || '',
        specializations: profileData?.specializations || [],
        languages: profileData?.languages || [],
        about: profileData?.about || '',
      });

      if (profileData?.profileImg) {
        const imageUrl = await getPreSignedURL(profileData.profileImg);
        setProfileImgUrl(imageUrl);
      }

      if (profileData?.certifications && profileData.certifications.length > 0) {
        const certUrls = await Promise.all(
          profileData.certifications.map(async (certPath: string) => {
            try {
              return await getPreSignedURL(certPath);
            } catch (err) {
              console.error(`Error fetching certificate URL for ${certPath}:`, err);
              return '';
            }
          })
        );
        setCertificateUrls(certUrls.filter(url => url !== ''));
      }

      if (profileData?.resume) {
        const resumePreSignedUrl = await getPreSignedURL(profileData.resume);
        setResumeUrl(resumePreSignedUrl);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadFileToS3 = async (file: File, type: string) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      
      const response = await axiosInstance.get('/therapist/s3-presigned-url', {
        params: { fileName, type }
      });
      
      const { uploadURL, fileURL } = response.data;

      await axiosInstance.put(uploadURL, file, {
        headers: { 'Content-Type': file.type }
      });

      return fileURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'resume' | 'certificates') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'profile' && files[0]) {
      setProfileImgFile(files[0]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImgPreview(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    } else if (type === 'resume' && files[0]) {
      setResumeFile(files[0]);
    } else if (type === 'certificates') {
      setCertificateFiles(Array.from(files));
    }
  };

  const handleAddSpecialization = () => {
    if (specializationInput.trim() && !formData.specializations.includes(specializationInput.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specializationInput.trim()]
      });
      setSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter(s => s !== spec)
    });
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      });
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUploadProgress('Preparing update...');

    try {
      const updatePayload: ProfileUpdatePayload = { ...formData };

      if (profileImgFile) {
        setUploadProgress('Uploading profile image...');
        const profileImgPath = await uploadFileToS3(profileImgFile, 'image');
        updatePayload.profileImg = profileImgPath;
      }

      if (resumeFile) {
        setUploadProgress('Uploading resume...');
        const resumePath = await uploadFileToS3(resumeFile, 'application/pdf');
        updatePayload.resume = resumePath;
      }

      if (certificateFiles.length > 0) {
        setUploadProgress('Uploading certificates...');
        const certPaths = await Promise.all(
          certificateFiles.map(file => uploadFileToS3(file, 'image'))
        );
        updatePayload.certifications = certPaths;
      }

      setUploadProgress('Updating profile...');
      await therapistProfileService.updateProfile(updatePayload);

      setUploadProgress('Profile updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setUploadProgress('');
        setProfileImgFile(null);
        setResumeFile(null);
        setCertificateFiles([]);
        setProfileImgPreview('');
        fetchProfile();
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setUploadProgress('');
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const nextCertificate = () => {
    setCurrentCertIndex((prev) => 
      prev === certificateUrls.length - 1 ? 0 : prev + 1
    );
  };

  const previousCertificate = () => {
    setCurrentCertIndex((prev) => 
      prev === 0 ? certificateUrls.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={fetchProfile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const defaultProfileImg = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop';

  const getApprovalStatusBadge = () => {
    switch (profile.approvalStatus) {
      case 'Approved':
        return (
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Verified
          </div>
        );
      case 'Requested':
        return (
          <div className="inline-flex items-center bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="w-5 h-5 mr-2" />
            Under Verification 
          </div>
        );
      case 'Rejected':
        return (
          <div className="inline-flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
            <XCircle className="w-5 h-5 mr-2" />
            Rejected
          </div>
        );
      case 'Pending':
      default:
        return (
          <div className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            Pending
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 sm:h-40"></div>
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end">
                <img
                  src={profileImgUrl || defaultProfileImg}
                  alt={fullName}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl object-cover"
                />
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{fullName}</h1>
                    {profile.approvalStatus === 'Approved' && (
                      <CheckCircle2 className="w-7 h-7 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mt-1">
                    <p className="text-lg text-gray-600">
                      {profile.qualification || 'Professional Therapist'}
                    </p>
                    {getApprovalStatusBadge()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Rejection Reason Alert */}
        {profile.approvalStatus === 'Rejected' && profile.rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow">
            <div className="flex items-start">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Application Rejection Reason
                </h3>
                <p className="text-red-700 leading-relaxed">
                  {profile.rejectionReason}
                </p>
                <p className="text-red-600 text-sm mt-3">
                  Please update your profile to address the issues mentioned above and resubmit for approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {profile.phone && (
            <div className="bg-white rounded-xl shadow p-5 flex items-center space-x-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile.gender && (
            <div className="bg-white rounded-xl shadow p-5 flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold text-gray-900">{profile.gender}</p>
              </div>
            </div>
          )}

          {profile.experience && (
            <div className="bg-white rounded-xl shadow p-5 flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-semibold text-gray-900">{profile.experience} years</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-5 flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <IndianRupee className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fee (starts at)</p>
              <p className="font-semibold text-gray-900">{profile.fee} /-</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {profile.about && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{profile.about}</p>
              </div>
            )}

            {/* Specializations */}
            {profile.specializations.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certificateUrls.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-4">
                  <Award className="w-6 h-6 text-indigo-600 mr-2" />
                  <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                </div>
                <div className="relative">
                  {/* Certificate Display */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <a
                      href={certificateUrls[currentCertIndex]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={certificateUrls[currentCertIndex]}
                        alt={`Certificate ${currentCertIndex + 1}`}
                        className="w-full h-96 object-contain bg-gray-50"
                      />
                    </a>
                  </div>

                  {/* Navigation Arrows - Only show if more than 1 certificate */}
                  {certificateUrls.length > 1 && (
                    <>
                      <button
                        onClick={previousCertificate}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Previous certificate"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                      <button
                        onClick={nextCertificate}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Next certificate"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                      </button>
                    </>
                  )}

                  {/* Indicator Dots - Only show if more than 1 certificate */}
                  {certificateUrls.length > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      {certificateUrls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentCertIndex(idx)}
                          className={`transition-all duration-200 rounded-full ${
                            idx === currentCertIndex
                              ? 'w-8 h-2 bg-indigo-600'
                              : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Go to certificate ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Certificate Counter */}
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Certificate {currentCertIndex + 1} of {certificateUrls.length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Email */}
            {profile.email && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center mb-2">
                  <Mail className="w-6 h-6 mr-2" />
                  <h3 className="text-lg font-semibold">Email</h3>
                </div>
                <p className="text-xl break-words">{profile.email}</p>
              </div>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-4">
                  <Languages className="w-6 h-6 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Languages</h3>
                </div>
                <div className="space-y-2">
                  {profile.languages.map((lang, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                      <span className="text-gray-700">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Download */}
            {resumeUrl && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Resume</h3>
                </div>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
                >
                  View Resume
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Profile Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={profileImgPreview || profileImgUrl || defaultProfileImg}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                  <label className="cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload New Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profile')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (years)
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="text"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., M.A. Clinical Psychology"
                />
              </div>

              {/* About */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About
                </label>
                <textarea
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add specialization"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialization}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add language"
                  />
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume (PDF)
                </label>
                <div className="flex items-center gap-4">
                  {resumeFile ? (
                    <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">{resumeFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm underline"
                    >
                      View Current Resume
                    </a>
                  ) : null}
                  <label className="cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Resume
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileChange(e, 'resume')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Certificates Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications (Images)
                </label>
                <div className="space-y-2">
                  {certificateFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {certificateFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm">
                          <Award className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {certificateUrls.length > 0 && certificateFiles.length === 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Current: {certificateUrls.length} certificate(s) uploaded
                    </p>
                  )}
                  <label className="cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 inline-flex">
                    <Upload className="w-5 h-5" />
                    Upload Certificates
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, 'certificates')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Uploading new certificates will replace existing ones
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-700 font-medium">{uploadProgress}</span>
                  </div>
                </div>
              )}

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      After updating your profile, your approval status will change to "Under Verification" 
                      and will need to be reviewed by the admin again.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistProfilePage;