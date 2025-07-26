import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import ExportService from '../../services/exportService';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AdminApplicationData, ScoringCriteria } from '../../types/admin.types';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import VideoScoringPanel from '../admin/VideoScoringPanel';
import AdminControlsPanel from '../admin/AdminControlsPanel';
import VideoSection from '../applications/VideoSection';
import { Eye, Star, Flag } from 'lucide-react';

interface AdminApplicationDetailPageProps {
  applicationId: string;
  onSidebarToggle?: () => void;
}

const AdminApplicationDetailPage: React.FC<AdminApplicationDetailPageProps> = ({ 
  applicationId, 
  onSidebarToggle 
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [application, setApplication] = useState<AdminApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [currentScores, setCurrentScores] = useState<Partial<ScoringCriteria>>({});
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { showSuccess, showError } = useNotificationHelpers();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mock data loading - replace with actual API calls
  useEffect(() => {
    const loadApplication = async () => {
      if (!applicationId) {
        setError(currentLanguage === 'th' ? 'ไม่พบรหัสใบสมัคร' : 'Application ID not found');
        setLoading(false);
        return;
      }

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock application data
        const mockApplication: AdminApplicationData = {
          id: applicationId,
          userId: 'user_123',
          applicationId: applicationId,
          competitionCategory: 'future',
          status: 'submitted',
          filmTitle: 'Digital Dreams of Chiang Mai',
          filmTitleTh: 'ความฝันดิจิทัลของเชียงใหม่',
          genres: ['Sci-Fi', 'Fantasy'],
          format: 'live-action',
          duration: 8,
          synopsis: 'A young programmer discovers an ancient algorithm hidden in Chiang Mai\'s digital infrastructure that can predict and alter the city\'s future. As she delves deeper into this mysterious code, she must choose between technological advancement and preserving the city\'s cultural heritage.',
          chiangmaiConnection: 'The film explores the intersection of Chiang Mai\'s rich cultural heritage with its emerging role as a technology hub in Northern Thailand.',
          
          submitterName: 'Ploy Futuristic',
          submitterNameTh: 'พลอย ฟิวเจอริสติก',
          submitterAge: 22,
          submitterPhone: '+66 89-123-4567',
          submitterEmail: 'ploy.future@email.com',
          submitterRole: 'Director',
          
          files: {
            filmFile: {
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              name: 'digital_dreams_final.mp4',
              size: 245760000
            },
            posterFile: {
              url: 'https://picsum.photos/600/800?random=1',
              name: 'digital_dreams_poster.jpg',
              size: 2048000
            },
            proofFile: {
              url: 'https://picsum.photos/800/600?random=2',
              name: 'student_id.jpg',
              size: 1024000
            }
          },
          
          // Admin-specific data
          scores: [
            {
              technical: 8,
              story: 7,
              creativity: 9,
              overall: 8,
              totalScore: 32,
              adminId: 'admin_1',
              adminName: 'Dr. Sarah Johnson',
              scoredAt: new Date('2025-01-15'),
              comments: 'Excellent technical execution with innovative use of visual effects. The story effectively balances technology and tradition.'
            },
            {
              technical: 7,
              story: 8,
              creativity: 8,
              overall: 7,
              totalScore: 30,
              adminId: 'admin_2',
              adminName: 'Prof. Somchai Techno',
              scoredAt: new Date('2025-01-16'),
              comments: 'Strong narrative structure and compelling character development. Good representation of Chiang Mai\'s cultural elements.'
            }
          ],
          adminNotes: 'Promising submission with strong technical merit. Consider for final round selection.',
          reviewStatus: 'in-progress',
          flagged: false,
          assignedReviewers: ['admin_1', 'admin_2', user?.uid || 'admin_3'],
          
          submittedAt: new Date('2025-01-10'),
          createdAt: new Date('2025-01-08'),
          lastModified: new Date('2025-01-16'),
          lastReviewedAt: new Date('2025-01-16')
        };

        setApplication(mockApplication);
        
        // Check if current user has already scored
        const userScore = mockApplication.scores.find(score => score.adminId === user?.uid);
        if (userScore) {
          setCurrentScores(userScore);
        }
        
      } catch (error) {
        console.error('Error loading application:', error);
        setError(currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'Error loading application data');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, user?.uid, currentLanguage]);

  const content = {
    th: {
      pageTitle: "รายละเอียดใบสมัคร",
      subtitle: "ดูและประเมินผลงานภาพยนตร์",
      loading: "กำลังโหลด...",
      toggleScoring: "แผงให้คะแนน",
      hideScoring: "ซ่อนแผงให้คะแนน",
      averageScore: "คะแนนเฉลี่ย",
      totalScores: "จำนวนผู้ตัดสิน",
      lastReviewed: "ตรวจสอบล่าสุด",
      flagged: "ตั้งค่าสถานะพิเศษ"
    },
    en: {
      pageTitle: "Application Details",
      subtitle: "View and evaluate film submission",
      loading: "Loading...",
      toggleScoring: "Show Scoring Panel",
      hideScoring: "Hide Scoring Panel",
      averageScore: "Average Score",
      totalScores: "Total Judges",
      lastReviewed: "Last Reviewed",
      flagged: "Flagged"
    }
  };

  const currentContent = content[currentLanguage];

  const handleScoreChange = (scores: Partial<ScoringCriteria>) => {
    setCurrentScores(scores);
  };

  const handleSaveScores = async (scores: ScoringCriteria) => {
    setIsSubmittingScore(true);
    try {
      // TODO: Implement actual score saving
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      if (application) {
        const updatedScores = application.scores.filter(score => score.adminId !== user?.uid);
        updatedScores.push(scores);
        
        setApplication(prev => prev ? {
          ...prev,
          scores: updatedScores,
          lastReviewedAt: new Date()
        } : null);
      }
      
      alert(currentLanguage === 'th' ? 'บันทึกคะแนนเรียบร้อย' : 'Scores saved successfully');
    } catch (error) {
      console.error('Error saving scores:', error);
      alert(currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving scores');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleStatusChange = async (status: AdminApplicationData['reviewStatus']) => {
    setIsUpdatingStatus(true);
    try {
      // TODO: Implement actual status update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplication(prev => prev ? { ...prev, reviewStatus: status } : null);
      alert(currentLanguage === 'th' ? 'อัปเดตสถานะเรียบร้อย' : 'Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert(currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการอัปเดต' : 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleNotesChange = async (notes: string) => {
    try {
      // TODO: Implement actual notes update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApplication(prev => prev ? { ...prev, adminNotes: notes } : null);
      alert(currentLanguage === 'th' ? 'บันทึกหมายเหตุเรียบร้อย' : 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert(currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving notes');
    }
  };

  const handleFlagToggle = async (flagged: boolean, reason?: string) => {
    try {
      // TODO: Implement actual flag toggle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApplication(prev => prev ? { 
        ...prev, 
        flagged, 
        flagReason: reason 
      } : null);
      
      const message = flagged 
        ? (currentLanguage === 'th' ? 'ตั้งค่าสถานะพิเศษเรียบร้อย' : 'Application flagged successfully')
        : (currentLanguage === 'th' ? 'ยกเลิกสถานะพิเศษเรียบร้อย' : 'Application unflagged successfully');
      
      alert(message);
    } catch (error) {
      console.error('Error toggling flag:', error);
      alert(currentLanguage === 'th' ? 'เกิดข้อผิดพลาด' : 'Error updating flag status');
    }
  };

  const handleExport = () => {
    if (!application) return;
    
    const exportService = new ExportService();
    exportService.exportApplicationPDF(application)
      .then(() => {
        showSuccess(
          currentLanguage === 'th' ? 'ส่งออกสำเร็จ' : 'Export Successful',
          currentLanguage === 'th' ? 'ไฟล์ PDF ถูกสร้างเรียบร้อยแล้ว' : 'PDF file has been generated successfully'
        );
      })
      .catch((error) => {
        showError(
          currentLanguage === 'th' ? 'การส่งออกล้มเหลว' : 'Export Failed',
          currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการสร้าง PDF' : 'An error occurred while generating PDF'
        );
      });
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryLogo = (category: string) => {
    const logos = {
      youth: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689",
      future: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287",
      world: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67"
    };
    return logos[category as keyof typeof logos];
  };

  const calculateAverageScore = () => {
    if (!application || application.scores.length === 0) return 0;
    return application.scores.reduce((sum, score) => sum + score.totalScore, 0) / application.scores.length;
  };

  // Loading State
  if (loading) {
    return (
      <div className="space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCB283] mb-4"></div>
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          showBackButton={true}
          onBackClick={() => window.location.hash = '#admin/gallery'}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        
        <div className="text-center py-12">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
            {error}
          </h2>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const averageScore = calculateAverageScore();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Zone Header */}
      <AdminZoneHeader
        title={application.filmTitle}
        subtitle={currentContent.subtitle}
        showBackButton={true}
        backButtonText={currentLanguage === 'th' ? 'กลับแกลเลอรี่' : 'Back to Gallery'}
        onBackClick={() => window.location.hash = '#admin/gallery'}
        onSidebarToggle={onSidebarToggle || (() => {})}
      >
        <div className="flex items-center space-x-4">
          {/* Score Summary */}
          {application.scores.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 glass-card rounded-lg">
              <Star className="w-4 h-4 text-[#FCB283]" />
              <span className={`text-sm ${getClass('body')} text-white`}>
                {averageScore.toFixed(1)}/40
              </span>
              <span className={`text-xs ${getClass('body')} text-white/60`}>
                ({application.scores.length} {currentLanguage === 'th' ? 'คะแนน' : 'scores'})
              </span>
            </div>
          )}
          
          {/* Flag Indicator */}
          {application.flagged && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <Flag className="w-4 h-4 text-red-400" />
              <span className={`text-red-400 text-sm ${getClass('body')}`}>
                {currentContent.flagged}
              </span>
            </div>
          )}
          
          {/* Competition Logo */}
          <img 
            src={getCategoryLogo(application.competitionCategory)}
            alt={`${application.competitionCategory} Competition Logo`}
            className="h-12 w-auto object-contain"
          />
        </div>
      </AdminZoneHeader>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Application Content */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Film Information */}
          <div className="glass-container rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Poster */}
              <div className="lg:col-span-1">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  <img
                    src={application.files.posterFile.url}
                    alt={`${application.filmTitle} Poster`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Film Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className={`text-2xl sm:text-3xl ${getClass('header')} text-white mb-2 leading-tight`}>
                    {currentLanguage === 'th' && application.filmTitleTh 
                      ? application.filmTitleTh 
                      : application.filmTitle}
                  </h1>
                  {application.filmTitleTh && (
                    <h2 className={`text-lg ${getClass('subtitle')} text-[#FCB283] opacity-80`}>
                      {currentLanguage === 'th' ? application.filmTitle : application.filmTitleTh}
                    </h2>
                  )}
                </div>

                {/* Film Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl">
                    <h4 className={`text-sm ${getClass('subtitle')} text-white/80 mb-2`}>
                      {currentLanguage === 'th' ? 'ผู้กำกับ' : 'Director'}
                    </h4>
                    <p className={`${getClass('body')} text-white`}>
                      {currentLanguage === 'th' && application.submitterNameTh 
                        ? application.submitterNameTh 
                        : application.submitterName}
                    </p>
                  </div>
                  
                  <div className="glass-card p-4 rounded-xl">
                    <h4 className={`text-sm ${getClass('subtitle')} text-white/80 mb-2`}>
                      {currentLanguage === 'th' ? 'ระยะเวลา' : 'Duration'}
                    </h4>
                    <p className={`${getClass('body')} text-white`}>
                      {application.duration} {currentLanguage === 'th' ? 'นาที' : 'minutes'}
                    </p>
                  </div>
                </div>

                {/* Synopsis */}
                <div>
                  <h4 className={`text-lg ${getClass('subtitle')} text-white mb-3`}>
                    {currentLanguage === 'th' ? 'เรื่องย่อ' : 'Synopsis'}
                  </h4>
                  <p className={`${getClass('body')} text-white/90 leading-relaxed`}>
                    {application.synopsis}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="relative">
            <VideoSection 
              application={application}
              isEditMode={false}
              canEdit={false}
            />
            
            {/* Scoring Panel Toggle */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowScoringPanel(!showScoringPanel)}
                className="flex items-center space-x-2 px-4 py-2 glass-container rounded-lg hover:bg-white/20 transition-colors"
              >
                <Star className="w-4 h-4 text-[#FCB283]" />
                <span className={`text-sm ${getClass('body')} text-white`}>
                  {showScoringPanel ? currentContent.hideScoring : currentContent.toggleScoring}
                </span>
              </button>
            </div>
          </div>

          {/* Scoring Panel */}
          {showScoringPanel && (
            <VideoScoringPanel
              applicationId={application.id}
              currentScores={currentScores}
              allScores={application.scores}
              onScoreChange={handleScoreChange}
              onSaveScores={handleSaveScores}
              isSubmitting={isSubmittingScore}
            />
          )}
        </div>

        {/* Right Column: Admin Controls */}
        <div className="xl:col-span-1">
          <AdminControlsPanel
            application={application}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onFlagToggle={handleFlagToggle}
            onExport={handleExport}
            onPrint={handlePrint}
            isUpdating={isUpdatingStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationDetailPage;