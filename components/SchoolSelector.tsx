"use client";

import { useMemo } from "react";
import { Program, School } from "../types";

interface SchoolSelectorProps {
  schools: School[];
  programs: Program[];
  selectedSchoolId: string;
  selectedProgramId: string;
  onSchoolChange: (schoolId: string) => void;
  onProgramChange: (programId: string) => void;
}

export default function SchoolSelector({
  schools,
  programs,
  selectedSchoolId,
  selectedProgramId,
  onSchoolChange,
  onProgramChange,
}: SchoolSelectorProps) {
  const filteredPrograms = useMemo(
    () => programs.filter((program) => program.school_id === selectedSchoolId),
    [programs, selectedSchoolId],
  );

  return (
    <section className="field-grid">
      <label className="field-group">
        <span className="field-label">目标学校</span>
        <select
          className="field-input"
          value={selectedSchoolId}
          onChange={(event) => onSchoolChange(event.target.value)}
        >
          <option value="">请选择学校</option>
          {schools.map((school) => (
            <option key={school.school_id} value={school.school_id}>
              {school.school_name} ({school.country})
            </option>
          ))}
        </select>
      </label>

      <label className="field-group">
        <span className="field-label">申请项目</span>
        <select
          className="field-input"
          value={selectedProgramId}
          onChange={(event) => onProgramChange(event.target.value)}
          disabled={!selectedSchoolId}
        >
          <option value="">请选择项目</option>
          {filteredPrograms.map((program) => (
            <option key={program.program_id} value={program.program_id}>
              {program.program_name} · {program.degree_type}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
