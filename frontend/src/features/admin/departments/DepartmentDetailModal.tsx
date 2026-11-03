import React from 'react'
import type { DepartmentDetailResponse } from '../../../types/admin.types'
import { Modal, Button } from '../../../components/common'

export interface DepartmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  department: DepartmentDetailResponse | null
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  isOpen,
  onClose,
  department,
}) => {
  if (!department) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Details"
      description={`Record information for department #${department.department_id}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Department Name
            </span>
            <span className="text-slate-900 font-bold text-sm">{department.department_name}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Department Code
            </span>
            <span className="text-slate-900 font-mono font-bold text-sm">
              {department.department_code}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Associated Classes
            </span>
            <span className="text-slate-800 font-semibold text-sm">
              {department.total_classes} classes
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Assigned Faculty
            </span>
            <span className="text-slate-800 font-semibold text-sm">
              {department.total_faculty} faculty
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
              Department ID
            </span>
            <span className="text-slate-600 font-mono">#{department.department_id}</span>
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

export default DepartmentDetailModal

