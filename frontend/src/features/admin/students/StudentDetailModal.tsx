import React from 'react'
import type { StudentDetailResponse } from '../../../types/admin.types'
import { Modal, StatusBadge, Button } from '../../../components/common'

export interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  student: StudentDetailResponse | null
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  if (!student) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Profile Details"
      description={`Record information for student ID #${student.student_id}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Full Name
            </span>
            <span className="text-slate-900 font-bold text-sm">{student.student_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Roll Number
            </span>
            <span className="text-slate-900 font-mono font-bold text-sm">{student.roll_number}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Username
            </span>
            <span className="text-slate-700 font-mono">{student.username}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Account Status
            </span>
            <StatusBadge status={student.account_status} size="sm" />
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Email Address
            </span>
            <span className="text-slate-700">{student.email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Student ID
            </span>
            <span className="text-slate-600 font-mono">#{student.student_id}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Linked User ID
            </span>
            <span className="text-slate-600 font-mono">#{student.user_id}</span>
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

export default StudentDetailModal

