// src/components/caps teams board/caps-attachment.jsx

import React from "react";
import fileTypeIcon from "../../../assets/file-type-icon.png";

export default function AdviserAttachBoard() {
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

      <style>{`
        .attachment-wrapper {
          background: #ffffff;
          border: 1px solid #B2B2B2;
          border-radius: 8px;
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #3B0304;
          width: 100%;
          max-width: 700px;
          margin-top: 30px;  /* Ensures it's aligned below the comment */
        }
        .attachment-row {
          display: flex;
          padding: 12px 16px;
          font-size: 14px;
          align-items: center;
        }
        .attachment-row.zebra {
          background-color: #FAFAFA;
        }
        .attachment-row.header-row {
          font-weight: bold;
          background-color: #FAFAFA; /* Zebra color for header */
        }
        .attachment-cell {
          flex: 1;
          padding-right: 10px;
          display: flex;
          align-items: center;
        }
        .attachment-cell.date-cell {
          text-align: right;
        }
        .header-cell {
          color: #3B0304;
          padding-left: 0;
        }
        .file-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
}
