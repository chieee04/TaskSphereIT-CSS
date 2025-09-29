// src/components/pm-tasks-board/pm-attachment.jsx

import React from "react";
import fileTypeIcon from "../../../assets/file-type-icon.png";
import "../../Style/ProjectManager/ManagerTaskBoardAttach.css"; // hiwalay na CSS file

export default function ManagerTaskBoardAttach() {
  return (
    <div className="attachment-wrapper">
      {/* Column Headers with Zebra Effect */}
      <div className="attachment-row zebra header-row">
        <div className="attachment-cell header-cell">Attachment</div>
        <div className="attachment-cell header-cell date-cell">Date</div>
      </div>

      {/* Data Rows with Zebra Effect */}
      <div className="attachment-row">
        <div className="attachment-cell">
          <img src={fileTypeIcon} alt="File Icon" className="file-icon" />
          Castaneda Chapter 3.pdf
        </div>
        <div className="attachment-cell date-cell">Feb 6, 2025</div>
      </div>

      <div className="attachment-row zebra">
        <div className="attachment-cell">
          <img src={fileTypeIcon} alt="File Icon" className="file-icon" />
          Another File.pdf
        </div>
        <div className="attachment-cell date-cell">Feb 5, 2025</div>
      </div>

      <div className="attachment-row">
        <div className="attachment-cell">
          <img src={fileTypeIcon} alt="File Icon" className="file-icon" />
          Sample Document.docx
        </div>
        <div className="attachment-cell date-cell">Feb 4, 2025</div>
      </div>
    </div>
  );
}
