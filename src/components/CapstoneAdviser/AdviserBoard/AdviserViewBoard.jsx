// src/components/caps teams board/AdviserViewBoard.jsx
import React, { useState, useEffect } from "react";
import profileIcon from "../../../assets/profile-icon.png";
import boardIcon from "../../../assets/tasks-board-icon.png";
import deleteIcon from "../../../assets/delete-icon.png";
import attachmentIcon from "../../../assets/attachment-icon.png";
import fileTypeIcon from "../../../assets/file-type-icon.png";
import AdviserAttachBoard from "./AdviserAttachBoard";

export default function AdviserViewBoard({ task, onBack }) {
  const [activeTab, setActiveTab] = useState("comments");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("customUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  if (!task) return null;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <h2 className="section-title">
        <img src={boardIcon} alt="Board Icon" className="icon-image" />
        Teams Board &gt; {task.status} &gt; {task.group_name}
      </h2>
      <hr className="divider" />

      <button onClick={onBack} style={{ marginBottom: "20px" }}>
        ← Back
      </button>

      <div className="tasks-container">
        <div className="tasks-layout">
          {/* Left Column = Task Info */}
          <div className="left-column">
            <div className="info-header">
              <div className="info-title">{task.task || "Untitled Task"}</div>
              <div className="info-status">
                <span className="status-dot" />
                <span className="status-text">{task.status}</span>
              </div>
            </div>
            <div className="info-grid">
              <div><strong>Subtasks:</strong></div><div>{task.subtask || "—"}</div>
              <div><strong>Element:</strong></div><div>{task.elements || "—"}</div>
              <div><strong>Date Created:</strong></div><div>{task.date_created || "—"}</div>
              <div><strong>Revision No:</strong></div><div>{task.revision || "No Revision"}</div>
              <div><strong>Due Date:</strong></div><div>{task.due_date || "—"}</div>
              <div><strong>Time:</strong></div><div>{task.time || "—"}</div>
              <div><strong>Methodology:</strong></div><div>{task.methodology || "—"}</div>
              <div><strong>Project Phase:</strong></div><div>{task.project_phase || "—"}</div>
            </div>
          </div>

          {/* Right Column = Comments / Attachments */}
          <div className="right-column">
            <div className="tabs">
              <div
                className={`tab ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments
              </div>
              <div
                className={`tab ${activeTab === "attachment" ? "active" : ""}`}
                onClick={() => setActiveTab("attachment")}
              >
                Attachment
              </div>
            </div>

            {activeTab === "comments" && (
              <>
                <div className="new-comment">
                  <div className="comment-header">
                    <div className="profile-area">
                      <img src={profileIcon} alt="Profile" className="profile-icon" />
                      <span className="profile-name">
                        {currentUser?.firstname} {currentUser?.lastname}
                      </span>
                    </div>
                    <img src={deleteIcon} alt="Delete" className="delete-icon" />
                  </div>
                  <textarea className="comment-input" placeholder="Leave a comment" />
                  <div className="comment-actions">
                    <button className="attach-button">
                      <img src={attachmentIcon} alt="Attach" className="attach-icon" />
                    </button>
                    <button className="send-button">Send</button>
                  </div>
                </div>

                {/* TODO: Replace static with fetched comments */}
                <div className="comment-section">
                  <div className="comment-item">
                    <img src={profileIcon} alt="Juliana" className="comment-profile" />
                    <div className="comment-body">
                      <div className="comment-header-name">
                        <span className="comment-author">Juliana N Castaneda</span>
                        <span className="comment-time">• Feb 6, 2025 at 3:00 PM</span>
                      </div>
                      <div className="comment-text">
                        Good afternoon, I’ve completed my part. See attached file.
                      </div>
                      <div className="comment-attachment">
                        <img src={fileTypeIcon} alt="File" className="file-icon" />
                        Castaneda Chapter 3.pdf
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "attachment" && <AdviserAttachBoard />}
          </div>
        </div>
      </div>
    </div>
  );
}
