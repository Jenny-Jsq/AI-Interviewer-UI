"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUpload from "../components/ResumeUpload";
import SchoolSelector from "../components/SchoolSelector";
import programs from "../data/programs.json";
import schools from "../data/schools.json";
import { validateCode } from "../lib/api";
import { Program, School } from "../types";

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [remainingUses, setRemainingUses] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");

  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [coverLetterText, setCoverLetterText] = useState("");

  const schoolList = schools as School[];
  const programList = programs as Program[];

  const canContinue = useMemo(
    () => codeVerified && Boolean(selectedSchoolId) && Boolean(selectedProgramId),
    [codeVerified, selectedSchoolId, selectedProgramId],
  );

  const handleUnlock = async () => {
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setCodeMessage("请输入 access code");
      return;
    }

    setIsValidatingCode(true);
    const result = await validateCode(trimmed);
    setIsValidatingCode(false);

    if (!result?.valid) {
      setCodeVerified(false);
      setRemainingUses(0);
      setCodeMessage(result?.message || "access code 无效或已用完");
      return;
    }

    setCodeVerified(true);
    setRemainingUses(result.remainingUses);
    setCodeMessage("验证成功，可以开始模拟面试。");
  };

  const handleContinue = () => {
    if (!canContinue) return;

    const params = new URLSearchParams({
      accessCode: accessCode.trim(),
      schoolId: selectedSchoolId,
      programId: selectedProgramId,
      resumeFileName,
      coverLetterText,
      remainingUses: String(remainingUses),
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
        <h2>使用权限</h2>
        <p className="panel-intro">请输入 access code 解锁功能。每个 code 最多可启动 3 次 mock interview。</p>

        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <input
            type="text"
            className="input"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="输入 access code"
          />
          <button className="primary-btn" type="button" onClick={handleUnlock} disabled={isValidatingCode}>
            {isValidatingCode ? "验证中..." : "解锁"}
          </button>
          {codeMessage ? <p className="panel-intro">{codeMessage}</p> : null}
        </div>

        {codeVerified ? (
          <>
            <p className="panel-intro">剩余可用次数：{remainingUses}</p>
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
              开始模拟面试
            </button>
          </>
        ) : null}
      </section>
    </main>
  );
}
