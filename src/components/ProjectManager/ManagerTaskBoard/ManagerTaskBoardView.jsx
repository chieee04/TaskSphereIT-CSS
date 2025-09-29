// src/components/pm-tasks-board/pm-view-tb.jsx
import React, { useState } from "react";
import profileIcon from "../../../assets/profile-icon.png";
import boardIcon from "../../../assets/tasks-board-icon.png"; // KEEP THIS ICON
import deleteIcon from "../../../assets/delete-icon.png";
import attachmentIcon from "../../../assets/attachment-icon.png";
import fileTypeIcon from "../../../assets/file-type-icon.png";
import "../../Style/ProjectManager/ManagerTaskBoardView.css"; // import external CSS

// import Attachment from "./pm-attachment";

export default function ManagerTaskBoardView() {
  const [activeTab, setActiveTab] = useState("comments");

  return (
    <div className="page-wrapper">
      {/* Header with icon and bold title */}
      <h2 className="section-title">
        <img src={boardIcon} alt="Board Icon" className="icon-image" />
        Tasks Board &gt; To Review &gt; Julliana Castaneda
      </h2>
      <hr className="divider" />

      <div className="tasks-container">
        <div className="tasks-layout">
          {/* Left Column */}
          <div className="left-column">
            <div className="info-header">
              <div className="info-title">Chapter 3</div>
              <div className="info-status">
                <span className="status-dot" />
                <span className="status-text">To Review</span>
              </div>
            </div>
            <div className="info-grid">
              <div><strong>Subtasks:</strong></div><div>Implementation</div>
              <div><strong>Element:</strong></div><div>Peopleware</div>
              <div><strong>Date Created:</strong></div><div>Feb 4, 2025</div>
              <div><strong>Revision No:</strong></div><div className="danger-text">No Revision</div>
              <div><strong>Due Date:</strong></div><div className="warning-text">Feb 7, 2025</div>
              <div><strong>Time:</strong></div><div>8:00 AM</div>
              <div><strong>Methodology:</strong></div><div>Agile</div>
              <div><strong>Project Phase:</strong></div><div>Analysis</div>
            </div>
          </div>

          {/* Right Column */}
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
                      <span className="profile-name">Harzwel Zhen B. Lacson</span>
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

                <div className="comment-section">
                  <div className="comment-item">
                    <img src={profileIcon} alt="Juliana" className="comment-profile" />
                    <div className="comment-body">
                      <div className="comment-header-name">
                        <span className="comment-author">Juliana N Castaneda</span>
                        <span className="comment-time">• Feb 6, 2025 at 3:00 PM</span>
                      </div>
                      <div className="comment-text">
                        Good afternoon, Add. I have already completed my part. Attached is the file my part. Thank you!
                      </div>
                      <div className="comment-attachment">
                        <img src={fileTypeIcon} alt="File" className="file-icon" />
                        Castaneda Chapter 3.pdf
                      </div>
                      <div className="replied-text">Replied</div>
                    </div>
                  </div>

                  <div className="comment-item reply">
                    <img src={profileIcon} alt="Adriallene" className="comment-profile" />
                    <div className="comment-body">
                      <div className="comment-header-name">
                        <span className="comment-author">Adriallene G Mendoza</span>
                        <span className="comment-time">• Feb 7, 2025 at 6:00 PM</span>
                      </div>
                      <div className="comment-text">
                        Good evening, Jull. I have already reviewed your work, and it’s correct. I will be adding it to our manuscript.
                      </div>
                      <div className="replied-text">Reply</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* {activeTab === "attachment" && <Attachment />} */}
          </div>
        </div>
      </div>
    </div>
  );
}
