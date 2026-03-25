"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUpload from "../components/ResumeUpload";
import SchoolSelector from "../components/SchoolSelector";
import programs from "../data/programs.json";
import schools from "../data/schools.json";
import { Program, School } from "../types";

export default function HomePage() {
  const router = useRouter();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");

  const schoolList = schools as School[];
  const programList = programs as Program[];

  const canContinue = useMemo(
    () => Boolean(selectedSchoolId) && Boolean(selectedProgramId),
    [selectedSchoolId, selectedProgramId],
  );

  const handleContinue = () => {
    if (!canContinue) return;

    const params = new URLSearchParams({
      schoolId: selectedSchoolId,
      programId: selectedProgramId,
      resumeFileName,
      coverLetterText,
    });

    router.push(`/interview?${params.toString()}`);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">🎓</div>
        <div>
          <h1>MockMaster AI</h1>
          <p>匹配您的面试官</p>
        </div>
      </header>

      <section className="panel panel-setup">
        <h2>上传信息</h2>
        <p className="panel-intro">请提供申请背景，我们会为您匹配更贴近目标院校风格的面试官。</p>

        <SchoolSelector
          schools={schoolList}
          programs={programList}
          selectedSchoolId={selectedSchoolId}
          selectedProgramId={selectedProgramId}
          onSchoolChange={(schoolId) => {
            setSelectedSchoolId(schoolId);
            setSelectedProgramId("");
          }}
          onProgramChange={setSelectedProgramId}
        />

        <ResumeUpload
          resumeFileName={resumeFileName}
          coverLetterText={coverLetterText}
          onResumeFileChange={setResumeFileName}
          onCoverLetterChange={setCoverLetterText}
        />

        <button className="primary-btn big-btn" type="button" onClick={handleContinue} disabled={!canContinue}>
          匹配面试官
        </button>
      </section>
    </main>
  );
}
