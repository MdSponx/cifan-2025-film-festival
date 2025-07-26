import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { AdminApplicationCard as AdminApplicationCardType, GalleryFilters, PaginationState, ExportProgress } from '../../types/admin.types';
import ExportService from '../../services/exportService';
import { useNotificationHelpers } from '../ui/NotificationSystem';
import ExportDialog from '../ui/ExportDialog';
import AdminZoneHeader from '../layout/AdminZoneHeader';
import AdminApplicationCard from '../ui/AdminApplicationCard';
import { Search, Download, Filter, Calendar, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';

interface AdminGalleryPageProps {
  onSidebarToggle?: () => void;
}

const AdminGalleryPage: React.FC<AdminGalleryPageProps> = ({ onSidebarToggle }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [applications, setApplications] = useState<AdminApplicationCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBulkSelect, setShowBulkSelect] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const { showSuccess, showError } = useNotificationHelpers();
  
  const [filters, setFilters] = useState<GalleryFilters>({
    category: 'all',
    status: 'all',
    dateRange: {},
    search: '',
    sortBy: 'newest',
    country: 'all'
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mock data generation for demonstration
  useEffect(() => {
    const generateMockApplications = (): AdminApplicationCardType[] => {
      const categories = ['youth', 'future', 'world'] as const;
      const statuses = ['draft', 'submitted', 'under-review', 'accepted', 'rejected'] as const;
      const countries = ['Thailand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Philippines', 'Vietnam', 'Indonesia', 'Taiwan', 'India', 'Australia', 'United States'];
      const genres = ['Horror', 'Sci-Fi', 'Fantasy', 'Dark Comedy', 'Folklore', 'Action', 'Surreal', 'Monster', 'Magic', 'Musical', 'Thriller'];
      const formats = ['live-action', 'animation'] as const;
      
      const filmTitles = [
        { en: 'Shadows of Tomorrow', th: 'เงาแห่งวันพรุ่งนี้' },
        { en: 'Digital Dreams', th: 'ความฝันดิจิทัล' },
        { en: 'The Last Temple', th: 'วัดสุดท้าย' },
        { en: 'Neon Nights', th: 'คืนนีออน' },
        { en: 'Ancient Spirits', th: 'วิญญาณโบราณ' },
        { en: 'Future Chiang Mai', th: 'เชียงใหม่อนาคต' },
        { en: 'Robot Monk', th: 'พระหุ่นยนต์' },
        { en: 'Time Traveler', th: 'นักเดินทางข้ามเวลา' },
        { en: 'Magic Market', th: 'ตลาดมหัศจรรย์' },
        { en: 'Cyber Lanna', th: 'ไซเบอร์ล้านนา' }
      ];
      
      const directors = [
        { en: 'Somchai Jaidee', th: 'สมชาย ใจดี' },
        { en: 'Niran Techno', th: 'นิรันดร์ เทคโน' },
        { en: 'Ploy Futuristic', th: 'พลอย ฟิวเจอริสติก' },
        { en: 'Kamon Digital', th: 'กมล ดิจิทัล' },
        { en: 'Siriporn Vision', th: 'ศิริพร วิชั่น' }
      ];

      const mockApps: AdminApplicationCardType[] = [];
      
      for (let i = 0; i < 85; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const title = filmTitles[Math.floor(Math.random() * filmTitles.length)];
        const director = directors[Math.floor(Math.random() * directors.length)];
        const genre = genres[Math.floor(Math.random() * genres.length)];
        const format = formats[Math.floor(Math.random() * formats.length)];
        
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
        
        const submittedDate = status !== 'draft' ? new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined;
        
        mockApps.push({
          id: `app_${i + 1}`,
          userId: `user_${Math.floor(Math.random() * 50) + 1}`,
          filmTitle: title.en,
          filmTitleTh: title.th,
          directorName: director.en,
          directorNameTh: director.th,
          competitionCategory: category,
          status: status,
          posterUrl: `https://picsum.photos/400/500?random=${i + 1}`,
          submittedAt: submittedDate,
          createdAt: createdDate,
          lastModified: new Date(),
          country: country,
          hasScores: status === 'under-review' || status === 'accepted' || status === 'rejected',
          averageScore: status === 'under-review' || status === 'accepted' || status === 'rejected' 
            ? Math.random() * 5 + 5 : undefined,
          reviewStatus: status === 'under-review' ? 'in-progress' : status === 'accepted' || status === 'rejected' ? 'completed' : 'pending',
          genres: [genre],
          duration: Math.floor(Math.random() * 6) + 5,
          format: format
        });
      }
      
      return mockApps;
    };

    // Simulate loading
    setTimeout(() => {
      const mockData = generateMockApplications();
      setApplications(mockData);
      setPagination(prev => ({
        ...prev,
        totalItems: mockData.length,
        totalPages: Math.ceil(mockData.length / prev.itemsPerPage)
      }));
      setLoading(false);
    }, 1500);
  }, [currentLanguage]);

  const content = {
    th: {
      pageTitle: "แกลเลอรี่ใบสมัคร",
      subtitle: "จัดการและดูใบสมัครทั้งหมดในระบบ",
      searchPlaceholder: "ค้นหาชื่อภาพยนตร์...",
      filterCategory: "หมวดหมู่",
      filterStatus: "สถานะ",
      filterCountry: "ประเทศ",
      sortBy: "เรียงตาม",
      allCategories: "ทุกหมวด",
      allStatuses: "ทุกสถานะ",
      allCountries: "ทุกประเทศ",
      youth: "เยาวชน",
      future: "อนาคต",
      world: "โลก",
      draft: "ร่าง",
      submitted: "ส่งแล้ว",
      underReview: "กำลังพิจารณา",
      accepted: "ผ่าน",
      rejected: "ไม่ผ่าน",
      newest: "ใหม่สุด",
      oldest: "เก่าสุด",
      alphabetical: "ตามตัวอักษร",
      byCategory: "ตามหมวด",
      byStatus: "ตามสถานะ",
      noApplications: "ไม่พบใบสมัคร",
      noApplicationsDesc: "ไม่มีใบสมัครที่ตรงกับเงื่อนไขการค้นหา",
      loading: "กำลังโหลด...",
      viewDetails: "ดูรายละเอียด",
      exportData: "ส่งออกข้อมูล",
      totalFound: "พบทั้งหมด",
      bulkSelect: "เลือกหลายรายการ",
      selectAll: "เลือกทั้งหมด",
      clearSelection: "ยกเลิกการเลือก",
      selectedItems: "รายการที่เลือก",
      gridView: "มุมมองตาราง",
      listView: "มุมมองรายการ",
      page: "หน้า",
      of: "จาก",
      itemsPerPage: "รายการต่อหน้า",
      showingResults: "แสดงผล"
    },
    en: {
      pageTitle: "Applications Gallery",
      subtitle: "Manage and view all applications in the system",
      searchPlaceholder: "Search film titles...",
      filterCategory: "Category",
      filterStatus: "Status",
      filterCountry: "Country",
      sortBy: "Sort By",
      allCategories: "All Categories",
      allStatuses: "All Statuses",
      allCountries: "All Countries",
      youth: "Youth",
      future: "Future",
      world: "World",
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under Review",
      accepted: "Accepted",
      rejected: "Rejected",
      newest: "Newest",
      oldest: "Oldest",
      alphabetical: "Alphabetical",
      byCategory: "By Category",
      byStatus: "By Status",
      noApplications: "No Applications Found",
      noApplicationsDesc: "No applications match your search criteria",
      loading: "Loading...",
      viewDetails: "View Details",
      exportData: "Export Data",
      totalFound: "Total Found",
      bulkSelect: "Bulk Select",
      selectAll: "Select All",
      clearSelection: "Clear Selection",
      selectedItems: "Selected Items",
      gridView: "Grid View",
      listView: "List View",
      page: "Page",
      of: "of",
      itemsPerPage: "Items per page",
      showingResults: "Showing"
    }
  };

  const currentContent = content[currentLanguage];

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(applications.map(app => app.country))).sort();

  // Filter and sort applications
  const filteredAndSortedApplications = React.useMemo(() => {
    let filtered = applications.filter(app => {
      const matchesSearch = app.filmTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
                           (app.filmTitleTh && app.filmTitleTh.toLowerCase().includes(filters.search.toLowerCase())) ||
                           app.directorName.toLowerCase().includes(filters.search.toLowerCase()) ||
                           (app.directorNameTh && app.directorNameTh.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesCategory = filters.category === 'all' || app.competitionCategory === filters.category;
      const matchesStatus = filters.status === 'all' || app.status === filters.status;
      const matchesCountry = filters.country === 'all' || app.country === filters.country;
      
      // Date range filter
      let matchesDateRange = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        const appDate = app.submittedAt || app.createdAt;
        if (filters.dateRange.start) {
          matchesDateRange = matchesDateRange && appDate >= new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          matchesDateRange = matchesDateRange && appDate <= new Date(filters.dateRange.end);
        }
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesCountry && matchesDateRange;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (b.submittedAt || b.createdAt).getTime() - (a.submittedAt || a.createdAt).getTime();
        case 'oldest':
          return (a.submittedAt || a.createdAt).getTime() - (b.submittedAt || b.createdAt).getTime();
        case 'alphabetical':
          return a.filmTitle.localeCompare(b.filmTitle);
        case 'category':
          return a.competitionCategory.localeCompare(b.competitionCategory);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, filters]);

  // Paginated applications
  const paginatedApplications = React.useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedApplications.slice(startIndex, endIndex);
  }, [filteredAndSortedApplications, pagination.currentPage, pagination.itemsPerPage]);

  // Update pagination when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: filteredAndSortedApplications.length,
      totalPages: Math.ceil(filteredAndSortedApplications.length / prev.itemsPerPage)
    }));
  }, [filteredAndSortedApplications]);

  const handleFilterChange = (key: keyof GalleryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportApplications = async (options: any) => {
    try {
      const exportService = new ExportService((progress) => {
        setExportProgress(progress);
      });

      await exportService.exportApplications(filteredAndSortedApplications, options);
      
      showSuccess(
        currentLanguage === 'th' ? 'ส่งออกสำเร็จ' : 'Export Successful',
        currentLanguage === 'th' ? 'ข้อมูลใบสมัครถูกส่งออกเรียบร้อยแล้ว' : 'Applications data has been exported successfully'
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

  const handleBulkSelect = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedItems);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedApplications.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedApplications.map(app => app.id)));
    }
  };

  const handleViewApplication = (id: string) => {
    window.location.hash = `#admin/application/${id}`;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleEditApplication = (id: string) => {
    window.location.hash = `#admin/application/${id}/edit`;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const getGridColumns = () => {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(pagination.totalPages, start + maxVisible - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className={`grid ${getGridColumns()} gap-4 sm:gap-6`}>
      {Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
        <div key={index} className="glass-container rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-[4/5] bg-white/20"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
          onSidebarToggle={onSidebarToggle || (() => {})}
        />
        <LoadingSkeleton />
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCB283] mb-4"></div>
          <p className={`${getClass('body')} text-white/80`}>
            {currentContent.loading}
          </p>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AdminZoneHeader
          title={currentContent.pageTitle}
          subtitle={currentContent.subtitle}
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
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Zone Header */}
      <AdminZoneHeader
        title={currentContent.pageTitle}
        subtitle={currentContent.subtitle}
        onSidebarToggle={onSidebarToggle || (() => {})}
      >
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#FCB283] text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
              title={currentContent.gridView}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-[#FCB283] text-white' 
                  : 'text-white/60 hover:text-white'
              }`}
              title={currentContent.listView}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Export Button */}
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

      {/* Filters and Search */}
      <div className="glass-container rounded-xl p-6">
        <div className="space-y-4">
          
          {/* Search and Bulk Actions Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder={currentContent.searchPlaceholder}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none"
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkSelect(!showBulkSelect)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showBulkSelect 
                    ? 'bg-[#FCB283] border-[#FCB283] text-white' 
                    : 'bg-white/10 border-white/20 text-white hover:border-[#FCB283]'
                }`}
              >
                {currentContent.bulkSelect}
              </button>
              
              {showBulkSelect && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:border-[#FCB283] transition-colors"
                  >
                    {selectedItems.size === paginatedApplications.length ? currentContent.clearSelection : currentContent.selectAll}
                  </button>
                  
                  {selectedItems.size > 0 && (
                    <span className="px-3 py-2 bg-[#FCB283]/20 text-[#FCB283] rounded-lg text-sm">
                      {selectedItems.size} {currentContent.selectedItems}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allCategories}</option>
              <option value="youth" className="bg-[#110D16]">{currentContent.youth}</option>
              <option value="future" className="bg-[#110D16]">{currentContent.future}</option>
              <option value="world" className="bg-[#110D16]">{currentContent.world}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allStatuses}</option>
              <option value="submitted" className="bg-[#110D16]">{currentContent.submitted}</option>
              <option value="draft" className="bg-[#110D16]">{currentContent.draft}</option>
              <option value="under-review" className="bg-[#110D16]">{currentContent.underReview}</option>
              <option value="accepted" className="bg-[#110D16]">{currentContent.accepted}</option>
              <option value="rejected" className="bg-[#110D16]">{currentContent.rejected}</option>
            </select>

            {/* Country Filter */}
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
            >
              <option value="all" className="bg-[#110D16]">{currentContent.allCountries}</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country} className="bg-[#110D16]">{country}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none"
            >
              <option value="newest" className="bg-[#110D16]">{currentContent.newest}</option>
              <option value="oldest" className="bg-[#110D16]">{currentContent.oldest}</option>
              <option value="alphabetical" className="bg-[#110D16]">{currentContent.alphabetical}</option>
              <option value="category" className="bg-[#110D16]">{currentContent.byCategory}</option>
              <option value="status" className="bg-[#110D16]">{currentContent.byStatus}</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-white/60" />
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none text-sm"
              />
              <span className="text-white/60">-</span>
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <p className={`${getClass('body')} text-white/70 text-sm`}>
              {currentContent.showingResults} {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredAndSortedApplications.length)} {currentContent.of} {filteredAndSortedApplications.length} {currentLanguage === 'th' ? 'รายการ' : 'items'}
            </p>
            
            <div className="flex items-center space-x-2">
              <span className={`${getClass('body')} text-white/70 text-sm`}>
                {currentContent.itemsPerPage}:
              </span>
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => setPagination(prev => ({ 
                  ...prev, 
                  itemsPerPage: parseInt(e.target.value),
                  currentPage: 1,
                  totalPages: Math.ceil(filteredAndSortedApplications.length / parseInt(e.target.value))
                }))}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white focus:border-[#FCB283] focus:outline-none text-sm"
              >
                <option value="20" className="bg-[#110D16]">20</option>
                <option value="40" className="bg-[#110D16]">40</option>
                <option value="60" className="bg-[#110D16]">60</option>
                <option value="100" className="bg-[#110D16]">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      {paginatedApplications.length > 0 ? (
        <div className={`grid ${getGridColumns()} gap-4 sm:gap-6`}>
          {paginatedApplications.map((application) => (
            <AdminApplicationCard
              key={application.id}
              application={application}
              onView={handleViewApplication}
              onEdit={handleEditApplication}
              isSelected={selectedItems.has(application.id)}
              onSelect={handleBulkSelect}
              showBulkSelect={showBulkSelect}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📄</div>
          <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
            {currentContent.noApplications}
          </h2>
          <p className={`${getClass('body')} text-white/80 max-w-md mx-auto`}>
            {currentContent.noApplicationsDesc}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="glass-container rounded-xl p-6">
          <div className="flex items-center justify-between">
            
            {/* Page Info */}
            <p className={`${getClass('body')} text-white/70 text-sm`}>
              {currentContent.page} {pagination.currentPage} {currentContent.of} {pagination.totalPages}
            </p>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:border-[#FCB283] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === pagination.currentPage
                      ? 'bg-[#FCB283] text-white'
                      : 'bg-white/10 border border-white/20 text-white hover:border-[#FCB283]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:border-[#FCB283] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExportApplications}
        exportType="applications"
        availableCategories={['youth', 'future', 'world']}
        availableStatuses={['draft', 'submitted', 'under-review', 'accepted', 'rejected']}
        progress={exportProgress}
      />
    </div>
  );
};

export default AdminGalleryPage;