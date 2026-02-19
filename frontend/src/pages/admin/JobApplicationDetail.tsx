import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Download, Eye, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/config/axios.config';
import { jobService } from '@/services/admin/jobServices';
import { toast } from 'sonner';
import type { JobApplicationDetailDTO } from '@/types/dtos/job.dto';
import ConfirmationModal from '@/components/shared/Modal';

const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<JobApplicationDetailDTO | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [certificationUrls, setCertificationUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId) {
        setError('Application ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(`/admin/job-applications/${applicationId}`);
        const appData: JobApplicationDetailDTO = response.data.application;

        if (!appData) {
          throw new Error('Application not found');
        }

        setApplication(appData);

        if (appData.profileImg) {
          try {
            const imgUrl = await getPreSignedURL(appData.profileImg);
            setProfileImageUrl(imgUrl);
          } catch (error) {
            console.error('Error fetching profile image URL:', error);
          }
        }

        if (appData.resume) {
          try {
            const resUrl = await getPreSignedURL(appData.resume);
            setResumeUrl(resUrl);
          } catch (error) {
            console.error('Error fetching resume URL:', error);
          }
        }

        if (appData.certifications && appData.certifications.length > 0) {
          const certUrls: string[] = [];
          for (const certFile of appData.certifications) {
            if (certFile) {
              try {
                const certUrl = await getPreSignedURL(certFile);
                certUrls.push(certUrl);
              } catch (error) {
                console.error('Error fetching certification URL:', error);
                certUrls.push('');
              }
            }
          }
          setCertificationUrls(certUrls);
        }
      } catch (err: unknown) {
        console.error('Error fetching application details:', err);
        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
            ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message as string)
            : err instanceof Error
              ? err.message
              : 'Failed to load application details';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  const validateRejectReason = (reason: string): boolean => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setRejectReasonError('Rejection reason is required');
      return false;
    }

    if (trimmedReason.length < 10) {
      setRejectReasonError('Reason must be at least 10 characters long');
      return false;
    }

    if (trimmedReason.length > 500) {
      setRejectReasonError('Reason must not exceed 500 characters');
      return false;
    }

    const isRepetitive = /^([a-zA-Z0-9!@#$%^&*(),.?":{}|<>])\1+$/.test(trimmedReason);
    if (isRepetitive) {
      setRejectReasonError('Reason cannot be repetitive characters');
      return false;
    }

    if (!/[a-zA-Z]/.test(trimmedReason)) {
      setRejectReasonError('Reason must contain at least one alphabetic character');
      return false;
    }

    const words = trimmedReason.split(/\s+/);
    if (words.length < 2) {
      setRejectReasonError('Reason must be descriptive (at least two words)');
      return false;
    }

    if (/(.)\1{4,}/.test(trimmedReason)) {
      setRejectReasonError('Reason contains too many repeated characters');
      return false;
    }

    setRejectReasonError('');
    return true;
  };

  const handleApprove = async () => {
    if (!application?._id) {
      toast.error('Application ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check current status before approving
      const response = await axiosInstance.get(`/admin/job-applications/${application._id}`);
      const currentStatus = response.data.application?.approvalStatus;
      
      if (currentStatus !== 'Requested') {
        setShowApproveModal(false);
        toast.error(`This application has already been ${currentStatus.toLowerCase()}.`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      await jobService.updateStatus(application._id, {
        status: 'Approved'
      });
      
      setShowApproveModal(false);
      toast.success('Application approved successfully!');
      navigate('/admin/job-applications');
    } catch (error: unknown) {
      console.error('Error approving application:', error);
      
      // Handle conflict error (already processed)
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
          ? ((error as { response?: { status?: number } }).response?.status as number)
          : null;

      const serverMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
          : null;

      if (status === 409) {
        setShowApproveModal(false);
        toast.error(serverMessage || 'This application has already been processed.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Failed to approve application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!application?._id) {
      toast.error('Application ID not found');
      return;
    }

    // Validate rejection reason
    if (!validateRejectReason(rejectReason)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Check current status before rejecting
      const response = await axiosInstance.get(`/admin/job-applications/${application._id}`);
      const currentStatus = response.data.application?.approvalStatus;
      
      if (currentStatus !== 'Requested') {
        setShowRejectModal(false);
        setRejectReason('');
        setRejectReasonError('');
        toast.error(`This application has already been ${currentStatus.toLowerCase()}.`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      await jobService.updateStatus(application._id, {
        status: 'Rejected',
        reason: rejectReason.trim()
      });
      
      setShowRejectModal(false);
      setRejectReason('');
      setRejectReasonError('');
      toast.success('Application rejected successfully!');
      navigate('/admin/job-applications');
    } catch (error: unknown) {
      console.error('Error rejecting application:', error);
      
      // Handle conflict error (already processed)
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
          ? ((error as { response?: { status?: number } }).response?.status as number)
          : null;

      const serverMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
          : null;

      if (status === 409) {
        setShowRejectModal(false);
        setRejectReason('');
        setRejectReasonError('');
        toast.error(serverMessage || 'This application has already been processed.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Failed to reject application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (url: string, displayName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = displayName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The application you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/admin/job-applications')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const isActionDisabled = application.approvalStatus !== 'Requested';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/admin/job-applications')}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Applications
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={application.applicantName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/128';
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {application.applicantName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{application.applicantName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  application.approvalStatus === 'Approved' 
                    ? 'bg-green-100 text-green-800' 
                    : application.approvalStatus === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.approvalStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{application.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Phone:</span>
                  <span className="text-sm">{application.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Gender:</span>
                  <span className="text-sm capitalize">{application.gender || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Experience:</span>
                  <span className="text-sm">{application.experience || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {!isActionDisabled && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <CheckCircle size={20} />
                Approve Application
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <XCircle size={20} />
                Reject Application
              </button>
            </div>
          )}
          
           {isActionDisabled && (
            <div className={`mt-6 p-4 rounded-lg ${
              application.approvalStatus === 'Approved' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                application.approvalStatus === 'Approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                This application has already been {application.approvalStatus.toLowerCase()}.
              </p>
            </div>
          )}
        </div>

        {/* Professional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Consultation Fee</h2>
            <p className="text-3xl font-bold text-green-600">₹{application.fee || '0'}</p>
            <p className="text-sm text-gray-500 mt-1">Per consultation (starting from)</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Qualification</h2>
            <p className="text-gray-700">{application.qualification || 'Not specified'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {application.specializations.length > 0 ? (
                application.specializations.map((spec, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                    {spec}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No specializations listed</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {application.languages.length > 0 ? (
                application.languages.map((lang: string, index: number) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No languages listed</span>
              )}
            </div>
          </div>
        </div>

        {/* About and Resume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed">{application.about || 'No description provided'}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Resume</h2>
            {resumeUrl ? (
              <button 
                onClick={() => handleDownload(resumeUrl, 'Resume.pdf')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg transition-colors w-full"
              >
                <Download size={20} />
                <span className="font-medium truncate">View / Download Resume</span>
              </button>
            ) : (
              <p className="text-gray-500">No resume available</p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h2>
          {!application.certifications || application.certifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No certifications available</p>
          ) : (
            <div className="space-y-3">
              {application.certifications.map((certFile: string, index: number) => {
                const fileName = certFile.split('/').pop() || certFile;
                const displayName = fileName.replace(/\.[^/.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' ');
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-800 font-medium capitalize">{displayName}</span>
                    {certificationUrls[index] ? (
                      <button 
                        onClick={() => handleDownload(certificationUrls[index], fileName)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Eye size={18} />
                        View Certificate
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Loading...</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Application?"
        description={`Are you sure you want to approve the application from ${application.applicantName}? This action will notify the applicant.`}
        icon={<CheckCircle className="w-6 h-6" />}
        variant="success"
        size="md"
        confirmButton={{
          label: 'Approve',
          variant: 'success',
          onClick: handleApprove,
          loading: isSubmitting
        }}
        cancelButton={{
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => setShowApproveModal(false),
          disabled: isSubmitting
        }}
        closeOnOutsideClick={!isSubmitting}
        preventCloseWhileLoading={true}
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setRejectReasonError('');
        }}
        title="Reject Application?"
        description={`Please provide a reason for rejecting the application from ${application.applicantName}.`}
        icon={<XCircle className="w-6 h-6" />}
        variant="danger"
        size="md"
        confirmButton={{
          label: 'Reject',
          variant: 'danger',
          onClick: handleReject,
          loading: isSubmitting,
          disabled: !rejectReason.trim() || !!rejectReasonError
        }}
        cancelButton={{
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => {
            setShowRejectModal(false);
            setRejectReason('');
            setRejectReasonError('');
          },
          disabled: isSubmitting
        }}
        closeOnOutsideClick={!isSubmitting}
        preventCloseWhileLoading={true}
      >
        <div className="text-left">
          <textarea
            value={rejectReason}
            onChange={(e) => {
              const newValue = e.target.value;
              setRejectReason(newValue);
              if (rejectReasonError) {
                validateRejectReason(newValue);
              }
            }}
            onBlur={() => validateRejectReason(rejectReason)}
            placeholder="Enter reason for rejection (minimum 10 characters)"
            className={`w-full border ${rejectReasonError ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 ${rejectReasonError ? 'focus:ring-red-500' : 'focus:ring-red-500'} min-h-24 resize-none`}
            disabled={isSubmitting}
            maxLength={500}
          />
          {rejectReasonError && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} />
              {rejectReasonError}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {rejectReason.length}/500 characters
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default ApplicationDetailPage;