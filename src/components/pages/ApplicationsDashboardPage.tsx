import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { DashboardStats, ExportProgress } from '../../types/admin.types';
import ExportService from '../../services/exportService';
import { useNotifications, useNotificationHelpers } from '../ui/NotificationSystem';
import ExportDialog from '../ui/ExportDialog';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import DashboardStatsCard from '../ui/DashboardStatsCard';
import CategoryBannerCard from '../ui/CategoryBannerCard';
import GenreDistributionChart from '../charts/GenreDistributionChart';
import CountryDistributionChart from '../charts/CountryDistributionChart';
import ApplicationTrendsChart from '../charts/ApplicationTrendsChart';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Edit, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Printer
} from 'lucide-react';

interface ApplicationsDashboardPageProps {
  onSidebarToggle?: () => void;
}

const ApplicationsDashboardPage: React.FC<ApplicationsDashboardPageProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const { showSuccess, showError } = useNotificationHelpers();

  // Mock chart data
  const [genreData, setGenreData] = useState([
    { genre: 'Horror', count: 45, percentage: 13.2, color: '#EF4444' },
    { genre: 'Sci-Fi', count: 38, percentage: 11.1, color: '#3B82F6' },
    { genre: 'Fantasy', count: 52, percentage: 15.2, color: '#8B5CF6' },
    { genre: 'Dark Comedy', count: 29, percentage: 8.5, color: '#F59E0B' },
    { genre: 'Folklore', count: 33, percentage: 9.6, color: '#10B981' },
    { genre: 'Action', count: 41, percentage: 12.0, color: '#F97316' },
    { genre: 'Surreal', count: 27, percentage: 7.9, color: '#EC4899' },
    { genre: 'Monster', count: 35, percentage: 10.2, color: '#6366F1' },
    { genre: 'Magic', count: 24, percentage: 7.0, color: '#14B8A6' },
    { genre: 'Musical', count: 18, percentage: 5.3, color: '#F472B6' }
  ]);

  const [countryData, setCountryData] = useState([
    { country: 'Thailand', count: 156, flag: '🇹🇭', code: 'TH' },
    { country: 'Japan', count: 34, flag: '🇯🇵', code: 'JP' },
    { country: 'South Korea', count: 28, flag: '🇰🇷', code: 'KR' },
    { country: 'Singapore', count: 22, flag: '🇸🇬', code: 'SG' },
    { country: 'Malaysia', count: 19, flag: '🇲🇾', code: 'MY' },
    { country: 'Philippines', count: 17, flag: '🇵🇭', code: 'PH' },
    { country: 'Vietnam', count: 15, flag: '🇻🇳', code: 'VN' },
    { country: 'Indonesia', count: 13, flag: '🇮🇩', code: 'ID' },
    { country: 'Taiwan', count: 12, flag: '🇹🇼', code: 'TW' },
    { country: 'India', count: 11, flag: '🇮🇳', code: 'IN' },
    { country: 'Australia', count: 9, flag: '🇦🇺', code: 'AU' },
    { country: 'United States', count: 6, flag: '🇺🇸', code: 'US' }
  ]);

  const [trendData, setTrendData] = useState(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic trend data with some randomness
      const baseYouth = Math.floor(Math.random() * 8) + 2;
      const baseFuture = Math.floor(Math.random() * 10) + 3;
      const baseWorld = Math.floor(Math.random() * 6) + 1;
      
      data.push({
        date: date.toISOString().split('T')[0],
        youth: baseYouth,
        future: baseFuture,
        world: baseWorld,
        total: baseYouth + baseFuture + baseWorld,
        dateFormatted: date.toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
          month: 'short',
          day: 'numeric'
        })
      });
    }
    
    return data;
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mock data loading - replace with actual API calls
  useEffect(() => {
    const loadDashboardStats = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockStats: DashboardStats = {
        totalApplications: 342,
        applicationsByCategory: {
          youth: 128,
          future: 145,
          world: 69
        },
        applicationsByStatus: {
          draft: 89,
          submitted: 253
        },
        recentSubmissions: 47,
        trends: [
          { category: 'youth', change: 12, isPositive: true },
          { category: 'future', change: 8, isPositive: true },
          { category: 'world', change: -3, isPositive: false }
        ]
      };
      
      setStats(mockStats);
      setLoading(false);
      
      // Simulate chart data loading with slight delay
      setTimeout(() => {
        setChartsLoading(false);
      }, 800);
    };

    loadDashboardStats();
  }, []);

  const handleExportDashboard = async (options: any) => {
    try {
      const exportService = new ExportService((progress) => {
        setExportProgress(progress);
      });

      const chartData = {
        genres: genreData,
        countries: countryData,
        trends: trendData
      };

      await exportService.exportDashboardStats(stats, chartData, options);
      
      showSuccess(
        currentLanguage === 'th' ? 'ส่งออกสำเร็จ' : 'Export Successful',
        currentLanguage === 'th' ? 'ข้อมูลแดชบอร์ดถูกส่งออกเรียบร้อยแล้ว' : 'Dashboard data has been exported successfully'
      );
      
      setShowExportDialog(false);
      setExportProgress(undefined);
    } catch (error) {
      showError(
        currentLanguage === 'th' ? 'การส่งออกล้มเหลว' : 'Export Failed',
        currentLanguage === 'th' ? 'เกิดข้อผิดพลาดในการส่งออกข้อมูล' : 'An error occurred while exporting data'
      );
    }
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const content = {
    th: {
      pageTitle: "แดชบอร์ดใบสมัคร",
      subtitle: "ภาพรวมและสถิติการสมัครเข้าประกวดภาพยนตร์",
      
      // Category titles
      youthTitle: "รางวัลหนังสั้นแฟนตาสติกเยาวชน",
      youthSubtitle: "นักเรียนระดับมัธยมศึกษา อายุ 12-18 ปี",
      futureTitle: "รางวัลหนังสั้นแฟนตาสติกอนาคต",
      futureSubtitle: "นักศึกษาระดับอุดมศึกษา อายุไม่เกิน 25 ปี",
      worldTitle: "รางวัลหนังสั้นแฟนตาสติกโลก",
      worldSubtitle: "ประชาชนทั่วไป ไม่จำกัดอายุ",
      
      // Stats cards
      totalApplications: "ใบสมัครทั้งหมด",
      totalApplicationsSubtitle: "ใบสมัครเข้าประกวดทั้งหมด",
      submittedApplications: "ส่งแล้ว",
      submittedApplicationsSubtitle: "ใบสมัครที่ส่งเรียบร้อยแล้ว",
      draftApplications: "ร่าง",
      draftApplicationsSubtitle: "ใบสมัครที่ยังไม่ได้ส่ง",
      recentSubmissions: "ส่งล่าสุด",
      recentSubmissionsSubtitle: "ใบสมัครใหม่ใน 7 วันที่ผ่านมา",
      
      // Additional stats
      submissionRate: "อัตราการส่ง",
      submissionRateSubtitle: "เปอร์เซ็นต์ใบสมัครที่ส่งแล้ว",
      averagePerDay: "เฉลี่ยต่อวัน",
      averagePerDaySubtitle: "ใบสมัครเฉลี่ยต่อวันใน 30 วัน",
      
      loading: "กำลังโหลดข้อมูล...",
      quickActions: "การดำเนินการด่วน",
      viewAllApplications: "ดูใบสมัครทั้งหมด",
      exportData: "ส่งออกข้อมูล",
      manageCategories: "จัดการหมวดการประกวด",
      printDashboard: "พิมพ์แดชบอร์ด"
    },
    en: {
      pageTitle: "Applications Dashboard",
      subtitle: "Overview and statistics of film competition submissions",
      
      // Category titles
      youthTitle: "Youth Fantastic Short Film Award",
      youthSubtitle: "High school students, age 12-18 years",
      futureTitle: "Future Fantastic Short Film Award", 
      futureSubtitle: "University students, age up to 25 years",
      worldTitle: "World Fantastic Short Film Award",
      worldSubtitle: "General public, no age limit",
      
      // Stats cards
      totalApplications: "Total Applications",
      totalApplicationsSubtitle: "All competition submissions",
      submittedApplications: "Submitted",
      submittedApplicationsSubtitle: "Completed submissions",
      draftApplications: "Drafts",
      draftApplicationsSubtitle: "Incomplete submissions",
      recentSubmissions: "Recent",
      recentSubmissionsSubtitle: "New submissions in last 7 days",
      
      // Additional stats
      submissionRate: "Submission Rate",
      submissionRateSubtitle: "Percentage of completed submissions",
      averagePerDay: "Daily Average",
      averagePerDaySubtitle: "Average submissions per day (30 days)",
      
      loading: "Loading dashboard data...",
      quickActions: "Quick Actions",
      viewAllApplications: "View All Applications",
      exportData: "Export Data",
      manageCategories: "Manage Categories",
      printDashboard: "Print Dashboard"
    }
  };

  const currentContent = content[currentLanguage];

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        
        {/* Loading Skeleton */}
        <div className="space-y-6">
          {/* Banner Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-container rounded-2xl p-8 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
                  <div className="w-16 h-6 bg-white/20 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-3/4 h-6 bg-white/20 rounded"></div>
                  <div className="w-1/2 h-4 bg-white/20 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="h-16 bg-white/10 rounded-xl"></div>
                  <div className="h-16 bg-white/10 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-container rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
                  <div className="w-12 h-6 bg-white/20 rounded-full"></div>
                </div>
                <div className="w-16 h-8 bg-white/20 rounded mb-2"></div>
                <div className="w-24 h-4 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCB283] mb-4"></div>
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate additional metrics
  const submissionRate = Math.round((stats.applicationsByStatus.submitted / stats.totalApplications) * 100);
  const averagePerDay = Math.round(stats.totalApplications / 30);

  // Get category data with trends
  const categoryData = [
    {
      category: 'youth' as const,
      title: currentContent.youthTitle,
      subtitle: currentContent.youthSubtitle,
      count: stats.applicationsByCategory.youth,
      percentage: Math.round((stats.applicationsByCategory.youth / stats.totalApplications) * 100),
      trend: stats.trends.find(t => t.category === 'youth') || { change: 0, isPositive: true },
      logo: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689"
    },
    {
      category: 'future' as const,
      title: currentContent.futureTitle,
      subtitle: currentContent.futureSubtitle,
      count: stats.applicationsByCategory.future,
      percentage: Math.round((stats.applicationsByCategory.future / stats.totalApplications) * 100),
      trend: stats.trends.find(t => t.category === 'future') || { change: 0, isPositive: true },
      logo: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287"
    },
    {
      category: 'world' as const,
      title: currentContent.worldTitle,
      subtitle: currentContent.worldSubtitle,
      count: stats.applicationsByCategory.world,
      percentage: Math.round((stats.applicationsByCategory.world / stats.totalApplications) * 100),
      trend: stats.trends.find(t => t.category === 'world') || { change: 0, isPositive: true },
      logo: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Zone Header */}
      <AdminZoneHeader
        title={currentContent.pageTitle}
        subtitle={currentContent.subtitle}
        onSidebarToggle={onSidebarToggle || (() => {})}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintDashboard}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className={`${getClass('menu')} text-sm`}>
              {currentContent.printDashboard}
            </span>
          </button>
          
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className={`${getClass('menu')} text-sm`}>
              {currentContent.exportData}
            </span>
          </button>
        </div>
      </AdminZoneHeader>

      {/* Category Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {categoryData.map((data) => (
          <CategoryBannerCard
            key={data.category}
            category={data.category}
            title={data.title}
            subtitle={data.subtitle}
            count={data.count}
            percentage={data.percentage}
            trend={data.trend}
            logo={data.logo}
            onClick={() => {
              window.location.hash = `#admin/gallery?category=${data.category}`;
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
          />
        ))}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <DashboardStatsCard
          icon={<FileText className="w-6 h-6" />}
          title={currentContent.totalApplications}
          value={stats.totalApplications}
          subtitle={currentContent.totalApplicationsSubtitle}
          trend={{ value: 15, isPositive: true }}
          colorScheme="primary"
          onClick={() => window.location.hash = '#admin/gallery'}
        />

        <DashboardStatsCard
          icon={<CheckCircle className="w-6 h-6" />}
          title={currentContent.submittedApplications}
          value={stats.applicationsByStatus.submitted}
          subtitle={currentContent.submittedApplicationsSubtitle}
          trend={{ value: 8, isPositive: true }}
          colorScheme="success"
          onClick={() => window.location.hash = '#admin/gallery?status=submitted'}
        />

        <DashboardStatsCard
          icon={<Edit className="w-6 h-6" />}
          title={currentContent.draftApplications}
          value={stats.applicationsByStatus.draft}
          subtitle={currentContent.draftApplicationsSubtitle}
          trend={{ value: 5, isPositive: false }}
          colorScheme="warning"
          onClick={() => window.location.hash = '#admin/gallery?status=draft'}
        />

        <DashboardStatsCard
          icon={<Clock className="w-6 h-6" />}
          title={currentContent.recentSubmissions}
          value={stats.recentSubmissions}
          subtitle={currentContent.recentSubmissionsSubtitle}
          trend={{ value: 23, isPositive: true }}
          colorScheme="info"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <GenreDistributionChart 
          data={genreData}
          loading={chartsLoading}
        />
        
        <CountryDistributionChart 
          data={countryData}
          loading={chartsLoading}
        />
        
        <div className="xl:col-span-2">
          <ApplicationTrendsChart 
            data={trendData}
            loading={chartsLoading}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Submission Rate Progress */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg ${getClass('header')} text-white flex items-center space-x-2`}>
              <PieChart className="w-5 h-5 text-[#FCB283]" />
              <span>{currentContent.submissionRate}</span>
            </h3>
            <span className={`text-2xl ${getClass('header')} text-[#FCB283]`}>
              {submissionRate}%
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Submitted Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`${getClass('body')} text-white/90 text-sm`}>
                  {currentContent.submittedApplications}
                </span>
                <span className={`${getClass('body')} text-green-400 text-sm font-medium`}>
                  {stats.applicationsByStatus.submitted}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${submissionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Draft Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`${getClass('body')} text-white/90 text-sm`}>
                  {currentContent.draftApplications}
                </span>
                <span className={`${getClass('body')} text-amber-400 text-sm font-medium`}>
                  {stats.applicationsByStatus.draft}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${100 - submissionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-container rounded-xl p-6 sm:p-8">
          <h3 className={`text-lg ${getClass('header')} text-white mb-6 flex items-center space-x-2`}>
            <Activity className="w-5 h-5 text-[#FCB283]" />
            <span>{currentContent.quickActions}</span>
          </h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => window.location.hash = '#admin/gallery'}
              className="w-full glass-card p-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-left group"
            >
              <div className="flex items-center space-x-4">
                <FileText className="w-8 h-8 text-[#FCB283] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className={`${getClass('subtitle')} text-white mb-1`}>
                    {currentContent.viewAllApplications}
                  </h4>
                  <p className={`${getClass('body')} text-white/60 text-sm`}>
                    {stats.totalApplications} {currentLanguage === 'th' ? 'รายการ' : 'items'}
                  </p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => window.location.hash = '#coming-soon'}
              className="w-full glass-card p-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-left group"
            >
              <div className="flex items-center space-x-4">
                <TrendingUp className="w-8 h-8 text-[#FCB283] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className={`${getClass('subtitle')} text-white mb-1`}>
                    {currentContent.exportData}
                  </h4>
                  <p className={`${getClass('body')} text-white/60 text-sm`}>
                    {currentLanguage === 'th' ? 'ส่งออกรายงานและสถิติ' : 'Export reports and analytics'}
                  </p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => window.location.hash = '#coming-soon'}
              className="w-full glass-card p-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-left group"
            >
              <div className="flex items-center space-x-4">
                <Calendar className="w-8 h-8 text-[#FCB283] group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className={`${getClass('subtitle')} text-white mb-1`}>
                    {currentContent.manageCategories}
                  </h4>
                  <p className={`${getClass('body')} text-white/60 text-sm`}>
                    {currentLanguage === 'th' ? 'จัดการหมวดการประกวด' : 'Manage competition categories'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="glass-container rounded-xl p-6 sm:p-8">
        <h3 className={`text-lg ${getClass('header')} text-white mb-6`}>
          📊 {currentLanguage === 'th' ? 'ข้อมูลเชิงลึก' : 'Key Insights'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className={`text-3xl ${getClass('header')} text-[#FCB283] mb-2`}>
              {averagePerDay}
            </div>
            <h4 className={`${getClass('subtitle')} text-white mb-1`}>
              {currentContent.averagePerDay}
            </h4>
            <p className={`${getClass('body')} text-white/60 text-sm`}>
              {currentContent.averagePerDaySubtitle}
            </p>
          </div>

          <div className="text-center">
            <div className={`text-3xl ${getClass('header')} text-green-400 mb-2`}>
              {Math.round((stats.applicationsByCategory.future / stats.totalApplications) * 100)}%
            </div>
            <h4 className={`${getClass('subtitle')} text-white mb-1`}>
              {currentLanguage === 'th' ? 'หมวดยอดนิยม' : 'Most Popular'}
            </h4>
            <p className={`${getClass('body')} text-white/60 text-sm`}>
              {currentLanguage === 'th' ? 'หมวดอนาคตมีผู้สมัครมากที่สุด' : 'Future category leads submissions'}
            </p>
          </div>

          <div className="text-center">
            <div className={`text-3xl ${getClass('header')} text-blue-400 mb-2`}>
              {Math.round((stats.recentSubmissions / stats.totalApplications) * 100)}%
            </div>
            <h4 className={`${getClass('subtitle')} text-white mb-1`}>
              {currentLanguage === 'th' ? 'กิจกรรมล่าสุด' : 'Recent Activity'}
            </h4>
            <p className={`${getClass('body')} text-white/60 text-sm`}>
              {currentLanguage === 'th' ? 'ใบสมัครใหม่ในสัปดาห์ที่ผ่านมา' : 'New submissions this week'}
            </p>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExportDashboard}
        exportType="dashboard"
        progress={exportProgress}
      />
    </div>
  );
};

export default ApplicationsDashboardPage;