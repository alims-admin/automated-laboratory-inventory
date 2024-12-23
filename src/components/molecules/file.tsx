import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface FilePreviewProps {
  file?: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [fileType, setFileType] = useState<string>("");
  const filePreview = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, [file]);

  useEffect(() => {
    if (file) {
      setFileType(file.type);
    }
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [file, filePreview]);

  const renderFilePreview = () => {
    if (!file) return null;

    if (fileType.startsWith("image")) {
      return (
        <Image
          src={filePreview || ""}
          alt="Preview"
          width={600}
          height={400}
          layout="intrinsic"
        />
      );
    }

    if (fileType.startsWith("text")) {
      return (
        <textarea
          readOnly
          value={filePreview || ""}
          rows={10}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
      );
    }

    if (fileType === "application/pdf") {
      return (
        <iframe
          src={filePreview}
          width="100%"
          height="400px"
          title="PDF Preview"
        ></iframe>
      );
    }

    if (fileType.startsWith("video")) {
      return (
        <video controls width="100%">
          <source src={filePreview} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (fileType.startsWith("audio")) {
      return (
        <audio controls>
          <source src={filePreview} type={fileType} />
          Your browser does not support the audio element.
        </audio>
      );
    }

    return (
      <div>
        <p>
          <strong>File:</strong> {file.name}
        </p>
        <p>
          <strong>File Type:</strong> {fileType}
        </p>
        <p>This file type is not supported for preview.</p>
      </div>
    );
  };

  return (
    <div className="file-preview">
      <h3>Preview:</h3>
      {renderFilePreview()}
    </div>
  );
};

export default FilePreview;
