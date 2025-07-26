import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { validateEmail, validateAge, getValidationMessages } from '../../utils/formValidation';
import { YouthFormData, FutureFormData, WorldFormData, CrewMember, FormErrors, SubmissionState, FileUploadState } from '../../types/form.types';
import { SubmissionService, SubmissionProgress } from '../../services/submissionService';
import { useAuth } from '../auth/AuthContext';
import AnimatedButton from '../ui/AnimatedButton';
import NationalitySelector from '../ui/NationalitySelector';
import GenreSelector from './GenreSelector';
import FormatSelector from './FormatSelector';
import CrewManagement from './CrewManagement';
import AgreementCheckboxes from './AgreementCheckboxes';
import FormSection from './FormSection';
import ErrorMessage from './ErrorMessage';
import UnifiedFileUpload from './UnifiedFileUpload';
import SubmissionProgressComponent from '../ui/SubmissionProgress';

type SubmissionCategory = 'youth' | 'future' | 'world';
type UnifiedFormData = YouthFormData | FutureFormData | WorldFormData;

interface UnifiedSubmissionFormProps {
  category: SubmissionCategory;
}

const UnifiedSubmissionForm: React.FC<UnifiedSubmissionFormProps> = ({ category }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user, userProfile } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';
  const validationMessages = getValidationMessages(currentLanguage);

  const [isThaiNationality, setIsThaiNationality] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fileUploadStates, setFileUploadStates] = useState<{[key: string]: FileUploadState}>({
    filmFile: { status: 'idle', progress: 0 },
    posterFile: { status: 'idle', progress: 0 },
    proofFile: { status: 'idle', progress: 0 }
  });

  // Scroll to top when component mounts (form opens)
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get category-specific configuration
  const getCategoryConfig = () => {
    const configs = {
      youth: {
        logoUrl: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689",
        prizeAmount: { th: "160,000 บาท", en: "160,000 THB" },
        categoryTitle: "Youth Fantastic Short Film Award",
        ageRange: { min: 12, max: 18 },
        validationCategory: 'YOUTH' as const,
        submissionMethod: 'submitYouthForm' as const,
        applicationPrefix: 'youth',
        educationFields: {
          schoolName: { th: "ชื่อโรงเรียน", en: "School Name" },
          studentId: { th: "รหัสนักเรียน", en: "Student ID" }
        }
      },
      future: {
        logoUrl: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287",
        prizeAmount: { th: "380,000 บาท", en: "380,000 THB" },
        categoryTitle: "Future Fantastic Short Film Award",
        ageRange: { min: 18, max: 25 },
        validationCategory: 'FUTURE' as const,
        submissionMethod: 'submitFutureForm' as const,
        applicationPrefix: 'future',
        educationFields: {
          universityName: { th: "ชื่อมหาวิทยาลัย", en: "University Name" },
          faculty: { th: "คณะ/สาขา", en: "Faculty/Department" },
          universityId: { th: "รหัสนักศึกษา", en: "Student ID" }
        }
      },
      world: {
        logoUrl: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67",
        prizeAmount: { th: "460,000 บาท", en: "460,000 THB" },
        categoryTitle: "World Fantastic Short Film Award",
        ageRange: { min: 18, max: 99 },
        validationCategory: 'WORLD' as const,
        submissionMethod: 'submitWorldForm' as const,
        applicationPrefix: 'world',
        educationFields: {}
      }
    };
    return configs[category];
  };

  const config = getCategoryConfig();

  // Initialize form data based on category
  const getInitialFormData = (): UnifiedFormData => {
    const baseData = {
      userId: user?.uid,
      applicationId: `${config.applicationPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft' as const,
      createdAt: new Date(),
      nationality: 'Thailand',
      
      // Film Information
      filmTitle: '',
      filmTitleTh: '',
      genres: [],
      format: '',
      duration: '',
      synopsis: '',
      chiangmaiConnection: '',
      
      // Files
      filmFile: null,
      posterFile: null,
      proofFile: null,
      
      // Agreements
      agreement1: false,
      agreement2: false,
      agreement3: false,
      agreement4: false,
      
      // Crew Information
      crewMembers: []
    };

    if (category === 'youth') {
      return {
        ...baseData,
        submitterName: userProfile?.fullNameEN || '',
        submitterNameTh: userProfile?.fullNameTH || '',
        submitterAge: userProfile?.age ? userProfile.age.toString() : '',
        submitterPhone: userProfile?.phoneNumber || '',
        submitterEmail: user?.email || '',
        submitterRole: '',
        submitterCustomRole: '',
        schoolName: '',
        studentId: ''
      } as YouthFormData;
    } else if (category === 'future') {
      return {
        ...baseData,
        submitterName: userProfile?.fullNameEN || '',
        submitterNameTh: userProfile?.fullNameTH || '',
        submitterAge: userProfile?.age ? userProfile.age.toString() : '',
        submitterPhone: userProfile?.phoneNumber || '',
        submitterEmail: user?.email || '',
        submitterRole: '',
        submitterCustomRole: '',
        universityName: '',
        faculty: '',
        universityId: ''
      } as FutureFormData;
    } else {
      return {
        ...baseData,
        directorName: userProfile?.fullNameEN || '',
        directorNameTh: userProfile?.fullNameTH || '',
        directorAge: userProfile?.age ? userProfile.age.toString() : '',
        directorPhone: userProfile?.phoneNumber || '',
        directorEmail: user?.email || '',
        directorRole: '',
        directorCustomRole: ''
      } as WorldFormData;
    }
  };

  const [formData, setFormData] = useState<UnifiedFormData>(getInitialFormData());

  // Check if user's age is over the regulation limit and prevent form access
  const checkAgeEligibility = () => {
    if (!userProfile?.age) return { eligible: true, suggestedCategory: null };
    
    const userAge = userProfile.age;
    
    // Check if user is over the age limit for current category
    if (userAge > config.ageRange.max && config.ageRange.max !== 99) {
      // Suggest appropriate category based on age
      let suggestedCategory = null;
      if (category === 'youth' && userAge >= 18 && userAge <= 25) {
        suggestedCategory = 'future';
      } else if ((category === 'youth' || category === 'future') && userAge > 25) {
        suggestedCategory = 'world';
      }
      
      return { eligible: false, suggestedCategory, userAge };
    }
    
    return { eligible: true, suggestedCategory: null };
  };

  const ageEligibility = checkAgeEligibility();

  // Update form data when user profile changes
  React.useEffect(() => {
    if (user && userProfile) {
      setFormData(prev => {
        const updates: any = {
          userId: user.uid
        };

        if (category === 'world') {
          updates.directorName = userProfile.fullNameEN || (prev as WorldFormData).directorName;
          updates.directorNameTh = userProfile.fullNameTH || (prev as WorldFormData).directorNameTh;
          updates.directorAge = userProfile.age ? userProfile.age.toString() : (prev as WorldFormData).directorAge;
          updates.directorPhone = userProfile.phoneNumber || (prev as WorldFormData).directorPhone;
          updates.directorEmail = user.email || (prev as WorldFormData).directorEmail;
        } else {
          updates.submitterName = userProfile.fullNameEN || (prev as YouthFormData | FutureFormData).submitterName;
          updates.submitterNameTh = userProfile.fullNameTH || (prev as YouthFormData | FutureFormData).submitterNameTh;
          updates.submitterAge = userProfile.age ? userProfile.age.toString() : (prev as YouthFormData | FutureFormData).submitterAge;
          updates.submitterPhone = userProfile.phoneNumber || (prev as YouthFormData | FutureFormData).submitterPhone;
          updates.submitterEmail = user.email || (prev as YouthFormData | FutureFormData).submitterEmail;
        }

        return { ...prev, ...updates };
      });
    }
  }, [user, userProfile, category]);

  // Get content based on category and language
  const getContent = () => {
    const baseContent = {
      th: {
        pageTitle: `ส่งผลงานเข้าประกวด - ${config.categoryTitle}`,
        categoryTitle: config.categoryTitle,
        prizeAmount: config.prizeAmount.th,
        
        // Sections
        filmInfoTitle: "ข้อมูลภาพยนตร์",
        submitterInfoTitle: category === 'world' ? "ข้อมูลผู้ส่งผลงาน" : "ข้อมูลผู้ส่งผลงาน",
        fileUploadTitle: "อัปโหลดไฟล์",
        
        // Form fields
        filmTitle: "ชื่อภาพยนตร์ (ภาษาอังกฤษ)",
        filmTitleTh: "ชื่อภาพยนตร์ (ภาษาไทย)",
        duration: "ความยาว (นาที)",
        synopsis: "เรื่องย่อ (ไม่เกิน 200 คำ)",
        chiangmaiConnection: "ความเกี่ยวข้องกับเชียงใหม่",
        
        submitterName: category === 'world' ? "ชื่อ-นามสกุล ผู้ส่งผลงาน" : "ชื่อ-นามสกุล",
        submitterNameTh: "ชื่อ-นามสกุล (ภาษาไทย)",
        age: "อายุ",
        phone: "เบอร์โทรศัพท์",
        email: "อีเมล",
        roleInFilm: "บทบาทในภาพยนตร์",
        
        // File upload fields
        filmFile: "ไฟล์ภาพยนตร์",
        posterFile: "โปสเตอร์ภาพยนตร์",
        proofFile: category === 'youth' ? "หลักฐานการเป็นนักเรียน" : 
                   category === 'future' ? "หลักฐานทางการศึกษา/บัตรประชาชน" : 
                   "หลักฐานบัตรประชาชน/พาสปอร์ต",
        
        selectRole: "เลือกบทบาท",
        specifyRole: "ระบุบทบาท",
        
        submitButton: "ส่งผลงานเข้าประกวด",
        submitting: "กำลังส่งผลงาน...",
        successMessage: "ส่งผลงานเรียบร้อยแล้ว!",
        
        // Confirmation dialog
        confirmTitle: "ยืนยันการส่งผลงาน",
        confirmMessage: "ใบสมัครของคุณอยู่ในโหมดร่าง กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนส่ง เมื่อส่งแล้วจะไม่สามารถแก้ไขได้อีก",
        deadlineReminder: "กำหนดส่งผลงาน: 5 กันยายน 2025 เวลา 23:59 น.",
        goToApplications: "ไปยังใบสมัครของฉัน",
        cancelSubmission: "ยกเลิก",
        confirmSubmission: "ยืนยันการส่ง"
      },
      en: {
        pageTitle: `Submit Your Film - ${config.categoryTitle}`,
        categoryTitle: config.categoryTitle,
        prizeAmount: config.prizeAmount.en,
        
        // Sections
        filmInfoTitle: "Film Information",
        submitterInfoTitle: "Submitter Information",
        fileUploadTitle: "File Upload",
        
        // Form fields
        filmTitle: "Film Title (English)",
        filmTitleTh: "Film Title (Thai)",
        duration: "Duration (minutes)",
        synopsis: "Synopsis (max 200 words)",
        chiangmaiConnection: "Connection to Chiang Mai",
        
        submitterName: category === 'world' ? "Submitter Full Name" : "Full Name",
        submitterNameTh: "Full Name (Thai)",
        age: "Age",
        phone: "Phone Number",
        email: "Email",
        roleInFilm: "Role in Film",
        
        // File upload fields
        filmFile: "Film File",
        posterFile: "Film Poster",
        proofFile: category === 'youth' ? "Student ID Proof" : 
                   category === 'future' ? "Educational Proof/ID Card" : 
                   "ID Card/Passport",
        
        selectRole: "Select Role",
        specifyRole: "Specify Role",
        
        submitButton: "Submit Your Film",
        submitting: "Submitting...",
        successMessage: "Submission successful!",
        
        // Confirmation dialog
        confirmTitle: "Confirm Submission",
        confirmMessage: "Your application is currently in draft mode. Please review your submission carefully before sending it. You will not be able to edit after submission.",
        deadlineReminder: "Submission deadline: September 5, 2025 at 11:59 PM",
        goToApplications: "Go to My Applications",
        cancelSubmission: "Cancel",
        confirmSubmission: "Confirm Submission"
      }
    };

    return baseContent[currentLanguage];
  };

  const currentContent = getContent();

  const validateDraftForm = (): FormErrors => {
    const errors: FormErrors = {};

    // User Authentication
    if (!user?.uid || !formData.userId) {
      errors.authentication = currentLanguage === 'th' 
        ? 'กรุณาเข้าสู่ระบบก่อนบันทึกร่าง' 
        : 'Please sign in before saving draft';
    }

    // Check if user's age is over regulation limit
    const currentAge = category === 'world' 
      ? parseInt((formData as WorldFormData).directorAge || '0')
      : parseInt((formData as YouthFormData | FutureFormData).submitterAge || '0');
    
    if (currentAge > config.ageRange.max && config.ageRange.max !== 99) {
      errors.ageOverLimit = currentLanguage === 'th'
        ? `อายุของคุณเกินกำหนด (${currentAge} ปี) การประกวดนี้เปิดรับเฉพาะผู้ที่มีอายุ ${config.ageRange.min}-${config.ageRange.max} ปี เท่านั้น`
        : `Your age (${currentAge} years) exceeds the limit. This competition is only open to participants aged ${config.ageRange.min}-${config.ageRange.max} years old.`;
    }

    // Basic required fields for draft (no file requirements)
    if (!formData.filmTitle.trim()) errors.filmTitle = validationMessages.required;
    if (isThaiNationality && !formData.filmTitleTh?.trim()) errors.filmTitleTh = validationMessages.required;

    // Submitter basic info
    if (category === 'world') {
      const worldData = formData as WorldFormData;
      if (!worldData.directorName.trim()) errors.submitterName = validationMessages.required;
      if (isThaiNationality && !worldData.directorNameTh?.trim()) errors.submitterNameTh = validationMessages.required;
      if (!worldData.directorEmail.trim()) {
        errors.submitterEmail = validationMessages.required;
      } else if (!validateEmail(worldData.directorEmail)) {
        errors.submitterEmail = validationMessages.invalidEmail;
      }
    } else {
      const submitterData = formData as YouthFormData | FutureFormData;
      if (!submitterData.submitterName.trim()) errors.submitterName = validationMessages.required;
      if (isThaiNationality && !submitterData.submitterNameTh?.trim()) errors.submitterNameTh = validationMessages.required;
      if (!submitterData.submitterEmail.trim()) {
        errors.submitterEmail = validationMessages.required;
      } else if (!validateEmail(submitterData.submitterEmail)) {
        errors.submitterEmail = validationMessages.invalidEmail;
      }
    }

    return errors;
  };

  const validateFullForm = (): FormErrors => {
    const errors: FormErrors = {};

    // User Authentication
    if (!user?.uid || !formData.userId) {
      errors.authentication = currentLanguage === 'th' 
        ? 'กรุณาเข้าสู่ระบบก่อนส่งผลงาน' 
        : 'Please sign in before submitting your work';
    }

    // Check if user's age is over regulation limit
    const currentAge = category === 'world' 
      ? parseInt((formData as WorldFormData).directorAge || '0')
      : parseInt((formData as YouthFormData | FutureFormData).submitterAge || '0');
    
    if (currentAge > config.ageRange.max && config.ageRange.max !== 99) {
      errors.ageOverLimit = currentLanguage === 'th'
        ? `อายุของคุณเกินกำหนด (${currentAge} ปี) การประกวดนี้เปิดรับเฉพาะผู้ที่มีอายุ ${config.ageRange.min}-${config.ageRange.max} ปี เท่านั้น`
        : `Your age (${currentAge} years) exceeds the limit. This competition is only open to participants aged ${config.ageRange.min}-${config.ageRange.max} years old.`;
    }

    // Film Information
    if (!formData.filmTitle.trim()) errors.filmTitle = validationMessages.required;
    if (isThaiNationality && !formData.filmTitleTh?.trim()) errors.filmTitleTh = validationMessages.required;
    if (!formData.genres || formData.genres.length === 0) errors.genres = validationMessages.required;
    if (!formData.format) errors.format = validationMessages.formatRequired;
    if (!formData.duration) {
      errors.duration = validationMessages.required;
    } else {
      const duration = parseInt(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        errors.duration = currentLanguage === 'th' ? 'กรุณากรอกความยาวที่ถูกต้อง' : 'Please enter a valid duration';
      }
    }
    if (!formData.synopsis.trim()) errors.synopsis = validationMessages.required;
    if (!formData.chiangmaiConnection.trim()) errors.chiangmaiConnection = validationMessages.required;

    // Submitter Information (varies by category)
    if (category === 'world') {
      const worldData = formData as WorldFormData;
      if (!worldData.directorName.trim()) errors.submitterName = validationMessages.required;
      if (isThaiNationality && !worldData.directorNameTh?.trim()) errors.submitterNameTh = validationMessages.required;
      if (!worldData.directorAge) {
        errors.submitterAge = validationMessages.required;
      } else {
        const age = parseInt(worldData.directorAge);
        if (!validateAge(age, config.validationCategory)) errors.submitterAge = validationMessages.invalidAge(config.validationCategory);
      }
      if (!worldData.directorPhone.trim()) errors.submitterPhone = validationMessages.required;
      if (!worldData.directorEmail.trim()) {
        errors.submitterEmail = validationMessages.required;
      } else if (!validateEmail(worldData.directorEmail)) {
        errors.submitterEmail = validationMessages.invalidEmail;
      }
      if (!worldData.directorRole) errors.submitterRole = validationMessages.required;
      if (worldData.directorRole === 'Other' && !worldData.directorCustomRole?.trim()) {
        errors.submitterCustomRole = validationMessages.required;
      }
    } else {
      const submitterData = formData as YouthFormData | FutureFormData;
      if (!submitterData.submitterName.trim()) errors.submitterName = validationMessages.required;
      if (isThaiNationality && !submitterData.submitterNameTh?.trim()) errors.submitterNameTh = validationMessages.required;
      if (!submitterData.submitterAge) {
        errors.submitterAge = validationMessages.required;
      } else {
        const age = parseInt(submitterData.submitterAge);
        if (!validateAge(age, config.validationCategory)) errors.submitterAge = validationMessages.invalidAge(config.validationCategory);
      }
      if (!submitterData.submitterPhone.trim()) errors.submitterPhone = validationMessages.required;
      if (!submitterData.submitterEmail.trim()) {
        errors.submitterEmail = validationMessages.required;
      } else if (!validateEmail(submitterData.submitterEmail)) {
        errors.submitterEmail = validationMessages.invalidEmail;
      }
      if (!submitterData.submitterRole) errors.submitterRole = validationMessages.required;
      if (submitterData.submitterRole === 'Other' && !submitterData.submitterCustomRole?.trim()) {
        errors.submitterCustomRole = validationMessages.required;
      }

      // Category-specific education fields
      if (category === 'youth') {
        const youthData = submitterData as YouthFormData;
        if (!youthData.schoolName.trim()) errors.schoolName = validationMessages.required;
        if (!youthData.studentId.trim()) errors.studentId = validationMessages.required;
      } else if (category === 'future') {
        const futureData = submitterData as FutureFormData;
        if (!futureData.universityName.trim()) errors.universityName = validationMessages.required;
        if (!futureData.faculty.trim()) errors.faculty = validationMessages.required;
        if (!futureData.universityId.trim()) errors.universityId = validationMessages.required;
      }
    }

    // File uploads - REQUIRED for final submission
    if (!formData.filmFile) errors.filmFile = validationMessages.required;
    if (!formData.posterFile) errors.posterFile = validationMessages.required;
    if (!formData.proofFile) errors.proofFile = validationMessages.required;

    // Agreements
    if (!formData.agreement1 || !formData.agreement2 || !formData.agreement3 || !formData.agreement4) {
      errors.agreements = validationMessages.allAgreementsRequired;
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGenreChange = (genres: string[]) => {
    setFormData(prev => ({ ...prev, genres }));
    if (formErrors.genres) {
      setFormErrors(prev => ({ ...prev, genres: '' }));
    }
  };

  const handleFormatChange = (format: 'live-action' | 'animation') => {
    setFormData(prev => ({ ...prev, format }));
    if (formErrors.format) {
      setFormErrors(prev => ({ ...prev, format: '' }));
    }
  };

  const handleCrewMembersChange = (crewMembers: CrewMember[]) => {
    setFormData(prev => ({ ...prev, crewMembers }));
    if (formErrors.crewMembers) {
      setFormErrors(prev => ({ ...prev, crewMembers: '' }));
    }
  };

  const handleAgreementChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
    if (formErrors.agreements) {
      setFormErrors(prev => ({ ...prev, agreements: '' }));
    }
  };

  // Handle nationality change from NationalitySelector
  const handleNationalityChange = useCallback((nationality: string) => {
    if (category !== 'world') {
      setFormData(prev => ({ ...prev, nationality }));
    }
  }, [category]);

  // Handle nationality type change from NationalitySelector
  const handleNationalityTypeChange = useCallback((isThaiNationality: boolean) => {
    setIsThaiNationality(isThaiNationality);
    
    // Clear Thai-specific fields when switching to International
    if (!isThaiNationality) {
      setFormData(prev => {
        const updates: any = {
          filmTitleTh: '',
          crewMembers: prev.crewMembers.map(member => ({
            ...member,
            fullNameTh: undefined
          }))
        };

        if (category === 'world') {
          updates.directorNameTh = '';
        } else {
          updates.submitterNameTh = '';
        }

        return { ...prev, ...updates };
      });
    }
  }, [category]);

  // Handle file changes
  const handleFileChange = (fieldName: keyof Pick<UnifiedFormData, 'filmFile' | 'posterFile' | 'proofFile'>) => (file: File | null) => {
    setFormData(prev => ({ ...prev, [fieldName]: file }));
    
    // Clear error when file is selected
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateFullForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmission = async () => {
    setShowConfirmDialog(false);
    
    // Reset submission state
    setSubmissionState({ isSubmitting: false });
    setFileUploadStates({
      filmFile: { status: 'idle', progress: 0 },
      posterFile: { status: 'idle', progress: 0 },
      proofFile: { status: 'idle', progress: 0 }
    });

    setSubmissionState({ isSubmitting: true });

    // Create submission service with progress callback
    const submissionService = new SubmissionService((progress: SubmissionProgress) => {
      setSubmissionState(prev => ({
        ...prev,
        progress
      }));

      // Update file upload states
      if (progress.fileProgress) {
        setFileUploadStates(prev => ({
          filmFile: { 
            status: progress.fileProgress!.film === 100 ? 'success' : 'uploading', 
            progress: progress.fileProgress!.film || 0 
          },
          posterFile: { 
            status: progress.fileProgress!.poster === 100 ? 'success' : 'uploading', 
            progress: progress.fileProgress!.poster || 0 
          },
          proofFile: { 
            status: progress.fileProgress!.proof === 100 ? 'success' : 'uploading', 
            progress: progress.fileProgress!.proof || 0 
          }
        }));
      }
    });

    try {
      let result;
      if (category === 'youth') {
        result = await submissionService.submitYouthForm(formData as YouthFormData);
      } else if (category === 'future') {
        result = await submissionService.submitFutureForm(formData as FutureFormData);
      } else {
        result = await submissionService.submitWorldForm(formData as WorldFormData);
      }
      
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        result
      }));

      if (result.success) {
        // Update file states to success
        setFileUploadStates({
          filmFile: { status: 'success', progress: 100 },
          posterFile: { status: 'success', progress: 100 },
          proofFile: { status: 'success', progress: 100 }
        });
      } else {
        // Update file states to error
        setFileUploadStates(prev => ({
          filmFile: { ...prev.filmFile, status: 'error', error: result.error },
          posterFile: { ...prev.posterFile, status: 'error', error: result.error },
          proofFile: { ...prev.proofFile, status: 'error', error: result.error }
        }));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        result: {
          success: false,
          error: currentLanguage === 'th' 
            ? 'เกิดข้อผิดพลาดในการส่งผลงาน กรุณาลองใหม่อีกครั้ง' 
            : 'An error occurred while submitting. Please try again.'
        }
      }));
    }
  };

  // Show success page
  if (submissionState.result?.success) {
    return (
      <div className="min-h-screen bg-[#110D16] text-white pt-16 sm:pt-20 flex items-center justify-center">
        <div className="glass-container rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-4">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className={`text-2xl sm:text-3xl ${getClass('header')} mb-4 text-white`}>
            {currentContent.successMessage}
          </h2>
          <p className={`text-white/80 ${getClass('body')} mb-6`}>
            {currentLanguage === 'th' 
              ? `ทางเทศกาลจะแจ้งผลการคัดเลือกภายใน 30 วัน ขอบคุณที่ส่งผลงานเข้าร่วม CIFAN 2025 (รหัสการส่ง: ${submissionState.result.submissionId})`
              : `The festival will announce the selection results within 30 days. Thank you for submitting to CIFAN 2025 (Submission ID: ${submissionState.result.submissionId})`
            }
          </p>
          
          <div className="space-y-4">
            <AnimatedButton 
              variant="primary"
              size="medium" 
              icon="📋"
              onClick={() => window.location.hash = '#my-applications'}
            >
              {currentLanguage === 'th' ? 'ไปยังใบสมัครของฉัน' : 'Go to My Applications'}
            </AnimatedButton>
            
            <AnimatedButton 
              variant="secondary"
              size="medium" 
              icon="🏠"
              onClick={() => window.location.hash = '#home'}
            >
              {currentLanguage === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  // Show age restriction page if user is not eligible
  if (!ageEligibility.eligible) {
    const getCategoryName = (cat: string) => {
      const names = {
        youth: { th: 'Youth Fantastic Short Film Award (อายุ 12-18 ปี)', en: 'Youth Fantastic Short Film Award (Ages 12-18)' },
        future: { th: 'Future Fantastic Short Film Award (อายุ 18-25 ปี)', en: 'Future Fantastic Short Film Award (Ages 18-25)' },
        world: { th: 'World Fantastic Short Film Award (อายุ 18+ ปี)', en: 'World Fantastic Short Film Award (Ages 18+)' }
      };
      return names[cat as keyof typeof names]?.[currentLanguage] || cat;
    };

    return (
      <div className="min-h-screen bg-[#110D16] text-white pt-16 sm:pt-20 flex items-center justify-center">
        <div className="glass-container rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-4">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className={`text-2xl sm:text-3xl ${getClass('header')} mb-4 text-red-400`}>
            {currentLanguage === 'th' ? 'ไม่สามารถเข้าถึงได้' : 'Access Restricted'}
          </h2>
          <p className={`text-white/80 ${getClass('body')} mb-6`}>
            {currentLanguage === 'th' 
              ? `อายุของคุณ (${ageEligibility.userAge} ปี) เกินกำหนดสำหรับการประกวด ${config.categoryTitle} ที่เปิดรับเฉพาะผู้ที่มีอายุ ${config.ageRange.min}-${config.ageRange.max} ปี`
              : `Your age (${ageEligibility.userAge} years) exceeds the limit for ${config.categoryTitle} which is only open to participants aged ${config.ageRange.min}-${config.ageRange.max} years old.`
            }
          </p>
          
          {ageEligibility.suggestedCategory && (
            <div className="mb-6 p-4 bg-green-600/20 border border-green-500/30 rounded-xl">
              <h3 className={`${getClass('subtitle')} text-green-300 mb-2`}>
                {currentLanguage === 'th' ? '💡 แนะนำสำหรับคุณ' : '💡 Recommended for You'}
              </h3>
              <p className={`${getClass('body')} text-green-100 mb-4`}>
                {currentLanguage === 'th' 
                  ? `ตามอายุของคุณ เราแนะนำให้สมัครในประเภท:`
                  : `Based on your age, we recommend applying for:`
                }
              </p>
              <p className={`${getClass('subtitle')} text-green-200 font-bold mb-4`}>
                {getCategoryName(ageEligibility.suggestedCategory)}
              </p>
              <AnimatedButton 
                variant="primary" 
                size="medium" 
                icon="🎬"
                onClick={() => window.location.hash = `#submit-${ageEligibility.suggestedCategory}`}
              >
                {currentLanguage === 'th' ? 'ไปยังการประกวดที่แนะนำ' : 'Go to Recommended Competition'}
              </AnimatedButton>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <AnimatedButton 
              variant="secondary" 
              size="medium" 
              icon="👤"
              onClick={() => window.location.hash = '#profile/edit'}
              className="flex-1 sm:flex-none sm:min-w-[160px]"
            >
              {currentLanguage === 'th' ? 'ตรวจสอบโปรไฟล์' : 'Check Profile'}
            </AnimatedButton>
            
            <AnimatedButton 
              variant="secondary" 
              size="medium" 
              icon="🏠"
              onClick={() => window.location.hash = '#home'}
              className="flex-1 sm:flex-none sm:min-w-[160px]"
            >
              {currentLanguage === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] text-white pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={config.logoUrl}
              alt={`${config.categoryTitle} Logo`}
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl ${getClass('header')} mb-4 text-white`}>
            {currentContent.pageTitle}
          </h1>
          <p className={`text-lg sm:text-xl ${getClass('subtitle')} text-[#FCB283] mb-4`}>
            {currentContent.categoryTitle}
          </p>
          <p className={`text-xl sm:text-2xl ${getClass('subtitle')} text-[#FCB283] font-bold`}>
            {currentLanguage === 'th' ? 'รางวัลรวม: ' : 'Total Prize: '}{currentContent.prizeAmount}
          </p>
          
          {/* Age Requirement Warning */}
          {(category === 'youth' || category === 'future') && (
            <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">⚠️</span>
                <h3 className={`${getClass('subtitle')} text-yellow-300`}>
                  {currentLanguage === 'th' ? 'ข้อกำหนดด้านอายุ' : 'Age Requirement'}
                </h3>
              </div>
              <p className={`${getClass('body')} text-yellow-100`}>
                {category === 'youth' 
                  ? (currentLanguage === 'th' 
                      ? 'การประกวดนี้เปิดรับเฉพาะผู้ที่มีอายุระหว่าง 12-18 ปี เท่านั้น กรุณาตรวจสอบอายุของคุณก่อนส่งผลงาน'
                      : 'This competition is only open to participants aged 12-18 years old. Please verify your age before submitting.')
                  : (currentLanguage === 'th' 
                      ? 'การประกวดนี้เปิดรับเฉพาะผู้ที่มีอายุระหว่าง 18-25 ปี เท่านั้น กรุณาตรวจสอบอายุของคุณก่อนส่งผลงาน'
                      : 'This competition is only open to participants aged 18-25 years old. Please verify your age before submitting.')
                }
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          
          {/* Submission Progress */}
          {submissionState.isSubmitting && submissionState.progress && (
            <SubmissionProgressComponent 
              progress={submissionState.progress}
              className="mb-8"
            />
          )}

          {/* Error Display */}
          {submissionState.result && !submissionState.result.success && (
            <div className="glass-container rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">❌</span>
                <h3 className={`${getClass('subtitle')} text-red-400`}>
                  {currentLanguage === 'th' ? 'เกิดข้อผิดพลาด' : 'Submission Error'}
                </h3>
              </div>
              <p className={`${getClass('body')} text-red-300`}>
                {submissionState.result.error}
              </p>
              <button
                type="button"
                onClick={() => setSubmissionState({ isSubmitting: false })}
                className={`mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white ${getClass('menu')} transition-colors`}
              >
                {currentLanguage === 'th' ? 'ลองใหม่' : 'Try Again'}
              </button>
            </div>
          )}

          {/* Authentication Error Display */}
          {formErrors.authentication && (
            <div className="glass-container rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">🔐</span>
                <h3 className={`${getClass('subtitle')} text-red-400`}>
                  {currentLanguage === 'th' ? 'ต้องเข้าสู่ระบบ' : 'Authentication Required'}
                </h3>
              </div>
              <p className={`${getClass('body')} text-red-300 mb-4`}>
                {formErrors.authentication}
              </p>
              <button
                type="button"
                onClick={() => window.location.hash = '#signin'}
                className={`px-4 py-2 bg-[#FCB283] hover:bg-[#AA4626] rounded-lg text-white ${getClass('menu')} transition-colors`}
              >
                {currentLanguage === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}
              </button>
            </div>
          )}

          {/* Age Over Limit Warning Display */}
          {formErrors.ageOverLimit && (
            <div className="glass-container rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className={`${getClass('subtitle')} text-red-400`}>
                  {currentLanguage === 'th' ? 'อายุเกินกำหนด' : 'Age Exceeds Limit'}
                </h3>
              </div>
              <p className={`${getClass('body')} text-red-300 mb-4`}>
                {formErrors.ageOverLimit}
              </p>
              <p className={`${getClass('body')} text-yellow-200`}>
                {currentLanguage === 'th' 
                  ? 'กรุณาตรวจสอบอายุของคุณในโปรไฟล์ หรือเลือกประเภทการประกวดที่เหมาะสมกับอายุของคุณ'
                  : 'Please check your age in your profile or choose a competition category suitable for your age.'
                }
              </p>
            </div>
          )}

          {/* Section 1: Nationality Selector */}
          {!submissionState.isSubmitting && (
            <NationalitySelector
              onNationalityChange={handleNationalityChange}
              onNationalityTypeChange={handleNationalityTypeChange}
            />
          )}

          {/* Section 2: Film Information */}
          {!submissionState.isSubmitting && (
            <FormSection title={currentContent.filmInfoTitle} icon="🎬">
              <div className="space-y-6">
                {/* Film Title Thai - Only for Thai nationality */}
                {isThaiNationality && (
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.filmTitleTh} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="filmTitleTh"
                      value={formData.filmTitleTh || ''}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.filmTitleTh ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.filmTitleTh} />
                  </div>
                )}
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.filmTitle} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="filmTitle"
                    value={formData.filmTitle}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.filmTitle ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.filmTitle} />
                </div>
                
                {/* Genre Selector - Full Width */}
                <GenreSelector
                  value={formData.genres}
                  onChange={handleGenreChange}
                  error={formErrors.genres}
                  required
                  label={currentLanguage === 'th' ? 'แนวภาพยนตร์' : 'Genre'}
                />
                
                {/* Format Selector - Full Width */}
                <FormatSelector
                  value={formData.format}
                  onChange={handleFormatChange}
                  error={formErrors.format}
                  required
                  label={currentLanguage === 'th' ? 'รูปแบบภาพยนตร์' : 'Film Format'}
                />
                
                {/* Duration Field - Separate Row */}
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.duration} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.duration ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <small className="text-white/60 text-xs mt-1 block">
                    {currentLanguage === 'th' ? 'แนะนำ 5-10 นาที (ไม่บังคับ)' : 'Recommended 5-10 minutes (not mandatory)'}
                  </small>
                  <ErrorMessage error={formErrors.duration} />
                </div>
              
                {/* Synopsis Field */}
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.synopsis} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="synopsis"
                    value={formData.synopsis}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.synopsis ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical`}
                  />
                  <ErrorMessage error={formErrors.synopsis} />
                </div>
              
                {/* Chiang Mai Connection Field */}
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.chiangmaiConnection} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="chiangmaiConnection"
                    value={formData.chiangmaiConnection}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.chiangmaiConnection ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical`}
                  />
                  <ErrorMessage error={formErrors.chiangmaiConnection} />
                </div>
              </div>
            </FormSection>
          )}

          {/* Section 3: Submitter Information */}
          {!submissionState.isSubmitting && (
            <FormSection title={currentContent.submitterInfoTitle} icon="👤">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.submitterName} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name={category === 'world' ? 'directorName' : 'submitterName'}
                    value={category === 'world' ? (formData as WorldFormData).directorName : (formData as YouthFormData | FutureFormData).submitterName}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.submitterName} />
                </div>
                
                {/* Thai Name - only for Thai nationality */}
                {isThaiNationality && (
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.submitterNameTh} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name={category === 'world' ? 'directorNameTh' : 'submitterNameTh'}
                      value={category === 'world' ? (formData as WorldFormData).directorNameTh || '' : (formData as YouthFormData | FutureFormData).submitterNameTh || ''}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterNameTh ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.submitterNameTh} />
                  </div>
                )}
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.age} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name={category === 'world' ? 'directorAge' : 'submitterAge'}
                    value={category === 'world' ? (formData as WorldFormData).directorAge : (formData as YouthFormData | FutureFormData).submitterAge}
                    onChange={handleInputChange}
                    min={config.ageRange.min}
                    max={config.ageRange.max === 99 ? undefined : config.ageRange.max}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterAge ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.submitterAge} />
                </div>
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.phone} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name={category === 'world' ? 'directorPhone' : 'submitterPhone'}
                    value={category === 'world' ? (formData as WorldFormData).directorPhone : (formData as YouthFormData | FutureFormData).submitterPhone}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterPhone ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.submitterPhone} />
                </div>
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.email} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name={category === 'world' ? 'directorEmail' : 'submitterEmail'}
                    value={category === 'world' ? (formData as WorldFormData).directorEmail : (formData as YouthFormData | FutureFormData).submitterEmail}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterEmail ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.submitterEmail} />
                </div>
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.roleInFilm} <span className="text-red-400">*</span>
                  </label>
                  <select
                    name={category === 'world' ? 'directorRole' : 'submitterRole'}
                    value={category === 'world' ? (formData as WorldFormData).directorRole : (formData as YouthFormData | FutureFormData).submitterRole}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterRole ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none`}
                  >
                    <option value="" className="bg-[#110D16]">{currentContent.selectRole}</option>
                    {['Director', 'Producer', 'Cinematographer', 'Editor', 'Sound Designer', 'Production Designer', 'Costume Designer', 'Makeup Artist', 'Screenwriter', 'Composer', 'Casting Director', 'Visual Effects Supervisor', 'Location Manager', 'Script Supervisor', 'Assistant Director', 'Other'].map(role => (
                      <option key={role} value={role} className="bg-[#110D16]">
                        {role}
                      </option>
                    ))}
                  </select>
                  <ErrorMessage error={formErrors.submitterRole} />
                </div>
                
                {/* Custom Role - only show if Other is selected */}
                {((category === 'world' && (formData as WorldFormData).directorRole === 'Other') || 
                  (category !== 'world' && (formData as YouthFormData | FutureFormData).submitterRole === 'Other')) && (
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.specifyRole} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name={category === 'world' ? 'directorCustomRole' : 'submitterCustomRole'}
                      value={category === 'world' ? (formData as WorldFormData).directorCustomRole || '' : (formData as YouthFormData | FutureFormData).submitterCustomRole || ''}
                      onChange={handleInputChange}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterCustomRole ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.submitterCustomRole} />
                  </div>
                )}
                
                {/* Category-specific education fields */}
                {category === 'youth' && (
                  <>
                    <div>
                      <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                        {(config.educationFields as any).schoolName?.[currentLanguage]} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="schoolName"
                        value={(formData as YouthFormData).schoolName}
                        onChange={handleInputChange}
                        className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.schoolName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                      />
                      <ErrorMessage error={formErrors.schoolName} />
                    </div>
                    
                    <div>
                      <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                        {(config.educationFields as any).studentId?.[currentLanguage]} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="studentId"
                        value={(formData as YouthFormData).studentId}
                        onChange={handleInputChange}
                        className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.studentId ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                      />
                      <ErrorMessage error={formErrors.studentId} />
                    </div>
                  </>
                )}
                
                {category === 'future' && (
                  <>
                    <div>
                      <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                        {(config.educationFields as any).universityName?.[currentLanguage]} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="universityName"
                        value={(formData as FutureFormData).universityName}
                        onChange={handleInputChange}
                        className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.universityName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                      />
                      <ErrorMessage error={formErrors.universityName} />
                    </div>
                    
                    <div>
                      <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                        {(config.educationFields as any).faculty?.[currentLanguage]} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="faculty"
                        value={(formData as FutureFormData).faculty}
                        onChange={handleInputChange}
                        className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.faculty ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                      />
                      <ErrorMessage error={formErrors.faculty} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                        {(config.educationFields as any).universityId?.[currentLanguage]} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="universityId"
                        value={(formData as FutureFormData).universityId}
                        onChange={handleInputChange}
                        className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.universityId ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                      />
                      <ErrorMessage error={formErrors.universityId} />
                    </div>
                  </>
                )}
              </div>
            </FormSection>
          )}

          {/* Section 4: Crew Information */}
          {!submissionState.isSubmitting && (
            <CrewManagement
              crewMembers={formData.crewMembers}
              onCrewMembersChange={handleCrewMembersChange}
              isThaiNationality={isThaiNationality}
              submitterSchoolName={category === 'youth' ? (formData as YouthFormData).schoolName : undefined}
              submitterUniversityName={category === 'future' ? (formData as FutureFormData).universityName : undefined}
              error={formErrors.crewMembers}
              isWorldForm={category === 'world'}
            />
          )}

          {/* Section 5: File Upload */}
          {!submissionState.isSubmitting && (
            <FormSection title={currentContent.fileUploadTitle} icon="📁">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <UnifiedFileUpload
                    mode="upload"
                    name="filmFile"
                    label={currentContent.filmFile}
                    accept=".mp4,.mov"
                    fileType="VIDEO"
                    required={true}
                    onFileChange={handleFileChange('filmFile')}
                    error={formErrors.filmFile}
                    currentFile={formData.filmFile}
                  />
                </div>
                
                <UnifiedFileUpload
                  mode="upload"
                  name="posterFile"
                  label={currentContent.posterFile}
                  accept=".jpg,.jpeg,.png"
                  fileType="IMAGE"
                  required={true}
                  onFileChange={handleFileChange('posterFile')}
                  error={formErrors.posterFile}
                  currentFile={formData.posterFile}
                />
                
                <UnifiedFileUpload
                  mode="upload"
                  name="proofFile"
                  label={currentContent.proofFile}
                  accept={category === 'youth' ? ".pdf,.jpg,.jpeg,.png" : "image/*,.pdf"}
                  fileType="DOCUMENT"
                  required={true}
                  onFileChange={handleFileChange('proofFile')}
                  error={formErrors.proofFile}
                  currentFile={formData.proofFile}
                />
              </div>
            </FormSection>
          )}

          {/* File Upload Progress */}
          {submissionState.isSubmitting && (
            <FormSection title={currentContent.fileUploadTitle} icon="📁">
              <div className="space-y-4">
                <UnifiedFileUpload
                  mode="progress"
                  name="filmFile"
                  label={currentContent.filmFile}
                  accept=".mp4,.mov"
                  fileType="VIDEO"
                  fileName={formData.filmFile?.name || 'Film File'}
                  progress={fileUploadStates.filmFile.progress}
                  status={fileUploadStates.filmFile.status}
                  progressError={fileUploadStates.filmFile.error}
                />
                <UnifiedFileUpload
                  mode="progress"
                  name="posterFile"
                  label={currentContent.posterFile}
                  accept=".jpg,.jpeg,.png"
                  fileType="IMAGE"
                  fileName={formData.posterFile?.name || 'Poster File'}
                  progress={fileUploadStates.posterFile.progress}
                  status={fileUploadStates.posterFile.status}
                  progressError={fileUploadStates.posterFile.error}
                />
                <UnifiedFileUpload
                  mode="progress"
                  name="proofFile"
                  label={currentContent.proofFile}
                  accept={category === 'youth' ? ".pdf,.jpg,.jpeg,.png" : "image/*,.pdf"}
                  fileType="DOCUMENT"
                  fileName={formData.proofFile?.name || 'Proof File'}
                  progress={fileUploadStates.proofFile.progress}
                  status={fileUploadStates.proofFile.status}
                  progressError={fileUploadStates.proofFile.error}
                />
              </div>
            </FormSection>
          )}

          {/* Section 6: Terms and Conditions */}
          {!submissionState.isSubmitting && (
            <AgreementCheckboxes
              agreements={{
                agreement1: formData.agreement1,
                agreement2: formData.agreement2,
                agreement3: formData.agreement3,
                agreement4: formData.agreement4
              }}
              onChange={handleAgreementChange}
              error={formErrors.agreements}
            />
          )}

          {/* Action Buttons */}
          {!submissionState.isSubmitting && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submissionState.isSubmitting}
                  className={`relative overflow-hidden font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 glass-button-primary text-white shadow-lg hover:shadow-[#AA4626]/30 px-8 py-4 text-lg rounded-2xl w-full sm:w-auto ${getClass('menu')} ${submissionState.isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>{submissionState.isSubmitting ? currentContent.submitting : currentContent.submitButton}</span>
                  </span>
                  
                  {/* Shine effect */}
                  {!submissionState.isSubmitting && (
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="glass-container rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className={`text-xl sm:text-2xl ${getClass('header')} mb-4 text-white`}>
                    {currentContent.confirmTitle}
                  </h3>
                  <p className={`${getClass('body')} text-white/80 mb-4`}>
                    {currentContent.confirmMessage}
                  </p>
                  <div className="p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg mb-6">
                    <p className={`${getClass('body')} text-yellow-200 text-sm`}>
                      📅 {currentContent.deadlineReminder}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className={`px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg ${getClass('menu')} transition-colors flex-1`}
                    >
                      {currentContent.cancelSubmission}
                    </button>
                    <button
                      onClick={handleConfirmSubmission}
                      className={`px-6 py-3 bg-[#FCB283] hover:bg-[#AA4626] text-white rounded-lg ${getClass('menu')} transition-colors flex-1`}
                    >
                      {currentContent.confirmSubmission}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UnifiedSubmissionForm;
