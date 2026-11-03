import React from 'react'
import type { FacultyDetailResponse } from '../../../types/admin.types'
import { Modal, StatusBadge, Button } from '../../../components/common'

export interface FacultyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  faculty: FacultyDetailResponse | null
}

export const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({
  isOpen,
  onClose,
  faculty,
}) => {
  if (!faculty) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Profile Details"
      description={`Record information for faculty ID #${faculty.faculty_id}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Faculty Name
            </span>
            <span className="text-slate-900 font-bold text-sm">{faculty.faculty_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Assigned Department
            </span>
            <span className="text-slate-900 font-bold text-sm">{faculty.department_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Username
            </span>
            <span className="text-slate-700 font-mono">{faculty.username}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Account Status
            </span>
            <StatusBadge status={faculty.account_status} size="sm" />
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Email Address
            </span>
            <span className="text-slate-700">{faculty.email}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Faculty ID
            </span>
            <span className="text-slate-600 font-mono">#{faculty.faculty_id}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Linked User ID
            </span>
            <span className="text-slate-600 font-mono">#{faculty.user_id}</span>
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

export default FacultyDetailModal

