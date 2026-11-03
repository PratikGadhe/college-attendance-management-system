import React from 'react'
import type { ClassDetailResponse } from '../../../types/admin.types'
import { Modal, Button } from '../../../components/common'

export interface ClassDetailModalProps {
  isOpen: boolean
  onClose: () => void
  classItem: ClassDetailResponse | null
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  isOpen,
  onClose,
  classItem,
}) => {
  if (!classItem) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Class Details"
      description={`Record information for class #${classItem.class_id}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Class Name
            </span>
            <span className="text-slate-900 font-bold text-sm">{classItem.class_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Department
            </span>
            <span className="text-slate-900 font-bold text-sm">{classItem.department_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Academic Year
            </span>
            <span className="text-slate-700 font-semibold">{classItem.academic_year}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Division & Semester
            </span>
            <span className="text-slate-700 font-semibold">
              Div {classItem.division} • Semester {classItem.semester}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Enrolled Students
            </span>
            <span className="text-indigo-700 font-extrabold text-sm">
              {classItem.total_enrolled_students} students currently enrolled
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Class ID
            </span>
            <span className="text-slate-600 font-mono">#{classItem.class_id}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Department ID
            </span>
            <span className="text-slate-600 font-mono">#{classItem.department_id}</span>
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

export default ClassDetailModal

