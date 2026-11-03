import React from 'react'
import type { SubjectDetailResponse } from '../../../types/admin.types'
import { Modal, Button } from '../../../components/common'

export interface SubjectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  subject: SubjectDetailResponse | null
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  isOpen,
  onClose,
  subject,
}) => {
  if (!subject) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Curriculum Subject Details"
      description={`Record information for subject #${subject.subject_id}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Subject Code
            </span>
            <span className="text-indigo-700 font-mono font-bold text-sm">
              {subject.subject_code}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Semester
            </span>
            <span className="text-slate-900 font-bold text-sm">Semester {subject.semester}</span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Subject Full Name
            </span>
            <span className="text-slate-800 font-semibold text-sm">{subject.subject_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Subject ID
            </span>
            <span className="text-slate-600 font-mono">#{subject.subject_id}</span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SubjectDetailModal

