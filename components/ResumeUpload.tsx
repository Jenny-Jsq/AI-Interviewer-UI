"use client";

import { ChangeEvent } from "react";

interface ResumeUploadProps {
  resumeFileName: string;
  coverLetterText: string;
  onResumeFileChange: (fileName: string) => void;
  onCoverLetterChange: (text: string) => void;
}

export default function ResumeUpload({
  resumeFileName,
  coverLetterText,
  onResumeFileChange,
  onCoverLetterChange,
}: ResumeUploadProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onResumeFileChange(file?.name ?? "");
  };

  return (
    <section className="upload-grid">
      <label className="upload-dropzone">
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        <span className="upload-title">点击或拖拽上传简历（CV）</span>
        <span className="upload-subtitle">支持 PDF / DOC / DOCX</span>
      </label>

      {resumeFileName ? <p className="upload-file">已选择：{resumeFileName}</p> : null}

      <label className="field-group">
        <span className="field-label">额外信息（动机信 / Essay / 简答题）</span>
        <textarea
          className="field-textarea"
          rows={6}
          placeholder="粘贴您的 Essay 或动机信内容..."
          value={coverLetterText}
          onChange={(event) => onCoverLetterChange(event.target.value)}
        />
      </label>
    </section>
  );
}
