import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { FILM_ROLES } from '../../utils/formConstants';
import { validateEmail, validateAge, getValidationMessages } from '../../utils/formValidation';
import { CrewMember, CrewFormData, FormErrors } from '../../types/form.types';
import AnimatedButton from '../ui/AnimatedButton';
import ErrorMessage from './ErrorMessage';

interface CrewManagementProps {
  crewMembers: CrewMember[];
  onCrewMembersChange: (crewMembers: CrewMember[]) => void;
  isThaiNationality: boolean;
  submitterSchoolName?: string;
  submitterUniversityName?: string;
  error?: string;
  isWorldForm?: boolean;
  className?: string;
}

const CrewManagement: React.FC<CrewManagementProps> = ({
  crewMembers,
  onCrewMembersChange,
  isThaiNationality,
  submitterSchoolName,
  submitterUniversityName,
  error,
  isWorldForm = false,
  className = ''
}) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';
  const validationMessages = getValidationMessages(currentLanguage);

  const [showCrewForm, setShowCrewForm] = useState(false);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [crewFormErrors, setCrewFormErrors] = useState<FormErrors>({});

  const [crewFormData, setCrewFormData] = useState<CrewFormData>({
    fullName: '',
    fullNameTh: '',
    role: '',
    customRole: '',
    age: '',
    phone: '',
    email: '',
    schoolName: submitterSchoolName || submitterUniversityName || '',
    studentId: ''
  });

  const content = {
    th: {
      crewInfoTitle: "ข้อมูลทีมงาน (ไม่บังคับ)",
      addCrewMember: "เพิ่มสมาชิกทีมงาน",
      crewMemberForm: "ข้อมูลสมาชิกทีมงาน",
      addMember: "เพิ่มสมาชิก",
      editMember: "แก้ไขสมาชิก",
      updateMember: "อัปเดตสมาชิก",
      cancel: "ยกเลิก",
      submitterName: "ชื่อ-นามสกุล",
      submitterNameTh: "ชื่อ-นามสกุล (ภาษาไทย)",
      age: "อายุ",
      phone: "เบอร์โทรศัพท์",
      email: "อีเมล",
      roleInFilm: "บทบาทในภาพยนตร์",
      schoolName: "ชื่อโรงเรียน/มหาวิทยาลัย",
      studentId: "รหัสนักเรียน/นักศึกษา",
      selectRole: "เลือกบทบาท",
      specifyRole: "ระบุบทบาท",
      optional: "(ไม่บังคับ)",
      tableHeaders: {
        name: "ชื่อ",
        role: "บทบาท",
        age: "อายุ",
        phone: "โทรศัพท์",
        email: "อีเมล",
        school: "โรงเรียน",
        studentId: "รหัสนักเรียน",
        actions: "การดำเนินการ"
      },
      edit: "แก้ไข",
      delete: "ลบ",
      noCrewMembers: "ยังไม่มีสมาชิกทีมงาน",
      confirmDelete: "คุณแน่ใจหรือไม่ที่จะลบสมาชิกคนนี้?"
    },
    en: {
      crewInfoTitle: "Crew Information (Optional)",
      addCrewMember: "Add Crew Member",
      crewMemberForm: "Crew Member Information",
      addMember: "Add Member",
      editMember: "Edit Member",
      updateMember: "Update Member",
      cancel: "Cancel",
      submitterName: "Full Name",
      submitterNameTh: "Full Name (Thai)",
      age: "Age",
      phone: "Phone Number",
      email: "Email",
      roleInFilm: "Role in Film",
      schoolName: "School/University Name",
      studentId: "Student ID",
      selectRole: "Select Role",
      specifyRole: "Specify Role",
      optional: "(Optional)",
      tableHeaders: {
        name: "Name",
        role: "Role",
        age: "Age",
        phone: "Phone",
        email: "Email",
        school: "School",
        studentId: "Student ID",
        actions: "Actions"
      },
      edit: "Edit",
      delete: "Delete",
      noCrewMembers: "No crew members added yet",
      confirmDelete: "Are you sure you want to delete this crew member?"
    }
  };

  const currentContent = content[currentLanguage];

  const validateCrewForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!crewFormData.fullName.trim()) errors.fullName = validationMessages.required;
    // Thai name only required for Thai nationality
    if (isThaiNationality && !crewFormData.fullNameTh.trim()) {
      errors.fullNameTh = validationMessages.required;
    }
    if (!crewFormData.role) errors.role = validationMessages.required;
    if (crewFormData.role === 'Other' && !crewFormData.customRole.trim()) {
      errors.customRole = validationMessages.required;
    }
    
    // Age validation - only for non-world forms
    if (!isWorldForm) {
      if (!crewFormData.age) {
        errors.age = validationMessages.required;
      } else {
        const age = parseInt(crewFormData.age);
        // Age validation based on form type
        const ageCategory = window.location.hash.includes('future') ? 'FUTURE' : 'YOUTH';
        if (!validateAge(age, ageCategory)) {
          errors.age = validationMessages.invalidAge(ageCategory);
        }
      }
    } else {
      // For world form, age is still required but no restrictions
      if (!crewFormData.age) {
        errors.age = validationMessages.required;
      }
    }
    
    if (crewFormData.email && !validateEmail(crewFormData.email)) {
      errors.email = validationMessages.invalidEmail;
    }
    
    // School name only required for non-world forms
    if (!isWorldForm) {
      if (!crewFormData.schoolName.trim()) {
        errors.schoolName = validationMessages.required;
      }
    }
    // Student ID is not required for crew members
    
    return errors;
  };

  const handleCrewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCrewFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (crewFormErrors[name]) {
      setCrewFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addCrewMember = () => {
    const errors = validateCrewForm();
    if (Object.keys(errors).length > 0) {
      setCrewFormErrors(errors);
      return;
    }

    const newMember: CrewMember = {
      id: editingCrewId || Date.now().toString(),
      fullName: crewFormData.fullName,
      fullNameTh: isThaiNationality ? crewFormData.fullNameTh : undefined,
      role: crewFormData.role,
      customRole: crewFormData.role === 'Other' ? crewFormData.customRole : undefined,
      age: parseInt(crewFormData.age),
      phone: crewFormData.phone || undefined,
      email: crewFormData.email || undefined,
      schoolName: isWorldForm ? '' : crewFormData.schoolName,
      studentId: isWorldForm ? '' : crewFormData.studentId
    };

    if (editingCrewId) {
      // Update existing member
      const updatedMembers = crewMembers.map(member =>
        member.id === editingCrewId ? newMember : member
      );
      onCrewMembersChange(updatedMembers);
      setEditingCrewId(null);
    } else {
      // Add new member
      onCrewMembersChange([...crewMembers, newMember]);
    }

    // Reset form
    resetCrewForm();

    // Scroll to crew management section after adding/updating member
    setTimeout(() => {
      const crewSection = document.querySelector('[data-crew-section]');
      if (crewSection) {
        crewSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const resetCrewForm = () => {
    setCrewFormData({
      fullName: '',
      fullNameTh: '',
      role: '',
      customRole: '',
      age: '',
      phone: '',
      email: '',
      schoolName: isWorldForm ? '' : (submitterSchoolName || submitterUniversityName || ''),
      studentId: ''
    });
    setCrewFormErrors({});
    setShowCrewForm(false);
  };

  const editCrewMember = (member: CrewMember) => {
    setCrewFormData({
      fullName: member.fullName,
      fullNameTh: member.fullNameTh || '',
      role: member.role,
      customRole: member.customRole || '',
      age: member.age.toString(),
      phone: member.phone || '',
      email: member.email || '',
      schoolName: isWorldForm ? '' : member.schoolName,
      studentId: isWorldForm ? '' : member.studentId
    });
    setEditingCrewId(member.id);
    setShowCrewForm(true);
    setCrewFormErrors({});

    // Scroll to crew form when editing
    setTimeout(() => {
      const crewForm = document.querySelector('[data-crew-form]');
      if (crewForm) {
        crewForm.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const deleteCrewMember = (id: string) => {
    const updatedMembers = crewMembers.filter(member => member.id !== id);
    onCrewMembersChange(updatedMembers);
    setShowDeleteConfirm(null);
  };

  return (
    <div className={`glass-container rounded-xl sm:rounded-2xl p-6 sm:p-8 ${className}`} data-crew-section>
      <h3 className={`text-lg sm:text-xl ${getClass('subtitle')} text-white mb-6`}>
        👥 {currentContent.crewInfoTitle}
      </h3>
      
      {/* Crew Members Error */}
      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} />
        </div>
      )}
      
      {/* Add Crew Member Button */}
      <div className="mb-6">
        <AnimatedButton
          variant="secondary"
          size="medium"
          icon="➕"
          onClick={() => {
            setShowCrewForm(true);
            // Scroll to crew form when opening
            setTimeout(() => {
              const crewForm = document.querySelector('[data-crew-form]');
              if (crewForm) {
                crewForm.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }
            }, 100);
          }}
          className={getClass('menu')}
        >
          {currentContent.addCrewMember}
        </AnimatedButton>
      </div>

      {/* Crew Member Form */}
      {showCrewForm && (
        <div className="glass-card p-6 rounded-xl border border-white/10 mb-6" data-crew-form>
          <h4 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
            {editingCrewId ? currentContent.editMember : currentContent.crewMemberForm}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.submitterName} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={crewFormData.fullName}
                onChange={handleCrewInputChange}
                className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.fullName ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
              />
              <ErrorMessage error={crewFormErrors.fullName} />
            </div>
            
            {/* Thai Name for crew - only for Thai nationality */}
            {isThaiNationality && (
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.submitterNameTh} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullNameTh"
                  value={crewFormData.fullNameTh}
                  onChange={handleCrewInputChange}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.fullNameTh ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={crewFormErrors.fullNameTh} />
              </div>
            )}
            
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.roleInFilm} <span className="text-red-400">*</span>
              </label>
              <select
                name="role"
                value={crewFormData.role}
                onChange={handleCrewInputChange}
                className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.role ? 'border-red-400' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none`}
              >
                <option value="" className="bg-[#110D16]">{currentContent.selectRole}</option>
                {FILM_ROLES.map(role => (
                  <option key={role} value={role} className="bg-[#110D16]">
                    {role}
                  </option>
                ))}
              </select>
              <ErrorMessage error={crewFormErrors.role} />
            </div>
            
            {crewFormData.role === 'Other' && (
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.specifyRole} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="customRole"
                  value={crewFormData.customRole}
                  onChange={handleCrewInputChange}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.customRole ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={crewFormErrors.customRole} />
              </div>
            )}
            
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.age} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={crewFormData.age}
                onChange={handleCrewInputChange}
                min={isWorldForm ? "1" : window.location.hash.includes('future') ? "18" : "12"}
                max={isWorldForm ? "100" : window.location.hash.includes('future') ? "25" : "18"}
                className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.age ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
              />
              {/* Age restriction warning for crew members */}
              <p className={`text-xs ${getClass('body')} text-white/60 mt-1`}>
                {!isWorldForm && window.location.hash.includes('future') && (currentLanguage === 'th' ? 'อายุไม่เกิน 25 ปี (นักศึกษาอุดมศึกษา)' : 'Age up to 25 years (University students)')}
                {!isWorldForm && !window.location.hash.includes('future') && (currentLanguage === 'th' ? 'อายุ 12-18 ปี (นักเรียนมัธยมศึกษา)' : 'Age 12-18 years (High school students)')}
                {isWorldForm && (currentLanguage === 'th' ? 'ไม่จำกัดอายุ (ประชาชนทั่วไป)' : 'No age limit (General public)')}
              </p>
              <ErrorMessage error={crewFormErrors.age} />
            </div>
            
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.phone} {currentContent.optional}
              </label>
              <input
                type="tel"
                name="phone"
                value={crewFormData.phone}
                onChange={handleCrewInputChange}
                className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.phone ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
              />
              <ErrorMessage error={crewFormErrors.phone} />
            </div>
            
            <div>
              <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                {currentContent.email} {currentContent.optional}
              </label>
              <input
                type="email"
                name="email"
                value={crewFormData.email}
                onChange={handleCrewInputChange}
                className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.email ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
              />
              <ErrorMessage error={crewFormErrors.email} />
            </div>
            
            {/* School Name - only for non-world forms */}
            {!isWorldForm && (
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.schoolName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={crewFormData.schoolName}
                  onChange={handleCrewInputChange}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.schoolName ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={crewFormErrors.schoolName} />
              </div>
            )}
            
            {/* Student ID - only for non-world forms */}
            {!isWorldForm && (
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.studentId} {currentContent.optional}
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={crewFormData.studentId}
                  onChange={handleCrewInputChange}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${crewFormErrors.studentId ? 'border-red-400' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={crewFormErrors.studentId} />
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-4">
            <AnimatedButton
              variant="primary"
              size="small"
              icon="✅"
              onClick={addCrewMember}
              className={getClass('menu')}
            >
              {editingCrewId ? currentContent.updateMember : currentContent.addMember}
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="small"
              icon="❌"
              onClick={() => {
                resetCrewForm();
                setEditingCrewId(null);
              }}
              className={getClass('menu')}
            >
              {currentContent.cancel}
            </AnimatedButton>
          </div>
        </div>
      )}

      {/* Crew Members Table */}
      <div className="overflow-x-auto">
        {crewMembers.length > 0 ? (
          <table className="w-full glass-card rounded-xl border border-white/10">
            <thead>
              <tr className="bg-gradient-to-r from-[#AA4626] to-[#FCB283]">
                <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                  {currentContent.tableHeaders.name}
                </th>
                <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                  {currentContent.tableHeaders.role}
                </th>
                <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                  {currentContent.tableHeaders.age}
                </th>
                {!isWorldForm && (
                  <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                    {currentContent.tableHeaders.school}
                  </th>
                )}
                <th className={`px-4 py-3 text-center ${getClass('subtitle')} text-white text-sm`}>
                  {currentContent.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {crewMembers.map((member) => (
                <tr key={member.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                    <div>
                      <div>{member.fullName}</div>
                      {member.fullNameTh && (
                        <div className="text-xs text-white/60">{member.fullNameTh}</div>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                    {member.role === 'Other' ? member.customRole : member.role}
                  </td>
                  <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                    {member.age}
                  </td>
                  {!isWorldForm && (
                    <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                      <div>
                        <div>{member.schoolName}</div>
                        <div className="text-xs text-white/60">{member.studentId}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => editCrewMember(member)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors"
                      >
                        {currentContent.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(member.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs transition-colors"
                      >
                        {currentContent.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="glass-card p-8 rounded-xl border border-white/10 text-center">
            <p className={`text-white/60 ${getClass('body')}`}>
              {currentContent.noCrewMembers}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-container rounded-xl p-6 max-w-md mx-4">
            <h4 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
              {currentContent.confirmDelete}
            </h4>
            <div className="flex gap-4">
              <AnimatedButton
                variant="primary"
                size="small"
                onClick={() => deleteCrewMember(showDeleteConfirm)}
                className={getClass('menu')}
              >
                {currentContent.delete}
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="small"
                onClick={() => setShowDeleteConfirm(null)}
                className={getClass('menu')}
              >
                {currentContent.cancel}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrewManagement;
