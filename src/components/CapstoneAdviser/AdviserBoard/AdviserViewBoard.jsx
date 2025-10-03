import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaPaperclip, FaComment, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { supabase } from "../../../supabaseClient";
 
const AdviserViewBoard = ({ task, onBack }) => {
  const [activeTab, setActiveTab] = useState("comments");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
 
  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("customUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);
 
  // Fetch comments from database
  useEffect(() => {
    if (task) {
      fetchComments();
    }
  }, [task]);
 
  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          profiles:user_id (
            firstname,
            lastname
          )
        `)
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
 
      if (error) throw error;
 
      // Transform the data to match our component structure
      const formattedComments = data.map(comment => ({
        id: comment.id,
        user_id: comment.user_id,
        user: `${comment.profiles.firstname} ${comment.profiles.lastname}`,
        text: comment.comment_text,
        timestamp: new Date(comment.created_at).toLocaleString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        attachment: comment.attachment_url,
        attachment_name: comment.attachment_name
      }));
 
      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
 
    try {
      setLoading(true);
 
      // Upload attachment if exists
      let attachmentUrl = null;
      let attachmentName = null;
 
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `task-attachments/${task.id}/${fileName}`;
 
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, attachment);
 
        if (uploadError) throw uploadError;
 
        const { data: urlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath);
 
        attachmentUrl = urlData.publicUrl;
        attachmentName = attachment.name;
      }
 
      // Insert comment into database
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: task.id,
          user_id: currentUser.id,
          comment_text: newComment,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })
        .select(`
          *,
          profiles:user_id (
            firstname,
            lastname
          )
        `)
        .single();
 
      if (error) throw error;
 
      // Add new comment to state
      const newCommentObj = {
        id: data.id,
        user_id: data.user_id,
        user: `${data.profiles.firstname} ${data.profiles.lastname}`,
        text: data.comment_text,
        timestamp: new Date(data.created_at).toLocaleString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        attachment: data.attachment_url,
        attachment_name: data.attachment_name
      };
 
      setComments([...comments, newCommentObj]);
      setNewComment("");
      setAttachment(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleEditComment = (comment) => {
    if (canEditComment(comment)) {
      setEditingComment(comment.id);
      setEditCommentText(comment.text);
    }
  };
 
  const handleSaveEdit = async () => {
    if (!editingComment || !editCommentText.trim()) return;
 
    try {
      setLoading(true);
      const { error } = await supabase
        .from("task_comments")
        .update({ 
          comment_text: editCommentText,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingComment);
 
      if (error) throw error;
 
      // Update comment in state
      setComments(comments.map(comment => 
        comment.id === editingComment 
          ? { ...comment, text: editCommentText }
          : comment
      ));
      setEditingComment(null);
      setEditCommentText("");
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
 
    try {
      setLoading(true);
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", commentId);
 
      if (error) throw error;
 
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };
 
  const removeAttachment = () => {
    setAttachment(null);
  };
 
  const clearComment = () => {
    setNewComment("");
    setAttachment(null);
  };
 
  // Check if current user can edit/delete this comment
  const canEditComment = (comment) => {
    return currentUser && comment.user_id === currentUser.id;
  };
 
  const statusColors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    "Missed Task": "#D32F2F",
  };
 
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString || dateString === "None") return "No Date";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };
 
  if (!task) return null;
 
  return (
    <div className="container mt-4">
      <style>
        {`
          .tasks-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
          }
          .left-column {
            background: linear-gradient(135deg, #5a0d0e 0%, #8b0000 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .right-column {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 0;
            border: 1px solid #e9ecef;
            overflow: hidden;
          }
          .info-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
          }
          .info-title {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .info-status {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: ${statusColors[task.status] || "#6c757d"};
          }
          .status-text {
            font-weight: bold;
            font-size: 0.9rem;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-grid > div {
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
          }
          .info-grid > div:nth-child(odd) {
            font-weight: bold;
            color: #f8f9fa;
          }
          .info-grid > div:nth-child(even) {
            color: #ffffff;
            font-weight: 500;
            text-align: right;
          }
          .tabs {
            display: flex;
            background: white;
            border-bottom: 1px solid #e9ecef;
          }
          .tab {
            flex: 1;
            padding: 15px 20px;
            text-align: center;
            cursor: pointer;
            font-weight: 500;
            color: #6c757d;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
          }
          .tab.active {
            color: #5a0d0e;
            border-bottom-color: #5a0d0e;
            background: #f8f9fa;
          }
          .tab:hover:not(.active) {
            background: #f8f9fa;
            color: #5a0d0e;
          }
          .tab-content {
            padding: 25px;
            max-height: 600px;
            overflow-y: auto;
          }
          .new-comment {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .profile-area {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .profile-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #5a0d0e;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
          }
          .profile-name {
            font-weight: bold;
            color: #5a0d0e;
          }
          .delete-icon {
            width: 20px;
            height: 20px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          .delete-icon:hover {
            opacity: 1;
          }
          .comment-input {
            width: 100%;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
            resize: vertical;
            font-size: 0.95rem;
            transition: border-color 0.2s;
            margin-bottom: 15px;
          }
          .comment-input:focus {
            border-color: #5a0d0e;
            box-shadow: 0 0 0 0.2rem rgba(90, 13, 14, 0.25);
            outline: none;
          }
          .comment-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .attach-button {
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.3s;
          }
          .attach-button:hover {
            background: #5a6268;
          }
          .send-button {
            background-color: #5a0d0e;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
          }
          .send-button:hover {
            background-color: #3b0304;
            transform: translateY(-1px);
          }
          .send-button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
            transform: none;
          }
          .comment-item {
            display: flex;
            gap: 15px;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
            background: white;
          }
          .comment-item:last-child {
            border-bottom: none;
          }
          .comment-profile {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #5a0d0e;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
            flex-shrink: 0;
          }
          .comment-body {
            flex: 1;
          }
          .comment-header-name {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }
          .comment-author {
            font-weight: bold;
            color: #5a0d0e;
          }
          .comment-time {
            color: #6c757d;
            font-size: 0.85rem;
          }
          .comment-text {
            line-height: 1.5;
            margin-bottom: 10px;
            color: #495057;
          }
          .comment-attachment {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            color: #5a0d0e;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.2s;
            cursor: pointer;
            margin-bottom: 10px;
          }
          .comment-attachment:hover {
            background: #e9ecef;
            text-decoration: none;
            color: #5a0d0e;
          }
          .file-icon {
            width: 16px;
            height: 16px;
          }
          .attachment-preview {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #e9ecef;
            border-radius: 6px;
            margin-bottom: 15px;
          }
          .attachment-preview button {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .attachment-preview button:hover {
            background: #dc3545;
            color: white;
          }
          .back-button {
            background: #5a0d0e;
            border: none;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            padding: 10px 20px;
            border-radius: 8px;
            transition: background-color 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
          }
          .back-button:hover {
            background-color: #3b0304;
          }
          .section-title {
            color: #5a0d0e;
            font-weight: bold;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .icon-image {
            width: 24px;
            height: 24px;
          }
          .divider {
            border: 0;
            border-top: 2px solid #5a0d0e;
            margin: 20px 0;
          }
          .comment-actions-editor {
            margin-top: 12px;
            display: flex;
            gap: 15px;
          }
          .comment-actions-editor button {
            background: none;
            border: none;
            color: #5a0d0e;
            cursor: pointer;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }
          .comment-actions-editor button:hover {
            background-color: rgba(90, 13, 14, 0.1);
          }
          .edit-comment-input {
            width: 100%;
            border: 2px solid #5a0d0e;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 12px;
            font-size: 0.95rem;
            resize: vertical;
          }
          .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
          }
          .file-input-wrapper input[type=file] {
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
          .loading-spinner {
            text-align: center;
            padding: 20px;
            color: #6c757d;
          }
        `}
      </style>
 
      {/* Header */}
      <h2 className="section-title">
        <div className="icon-image">📋</div>
        Teams Board &gt; {task.status} &gt; {task.group_name}
      </h2>
      <hr className="divider" />
 
      <button className="back-button" onClick={onBack}>
        <FaArrowLeft />
        Back to Board
      </button>
 
      <div className="tasks-container">
        <div className="tasks-layout">
          {/* Left Column = Task Info */}
          <div className="left-column">
            <div className="info-header">
              <div className="info-title">{task.group_name || "Untitled Task"}</div>
              <div className="info-status">
                <span className="status-dot" />
                <span className="status-text">{task.status}</span>
              </div>
            </div>
            <div className="info-grid">
              <div>Group Name:</div>
              <div>{task.group_name || "None"}</div>
 
              <div>Methodology:</div>
              <div>{task.methodology || "None"}</div>
 
              <div>Project Phase:</div>
              <div>{task.project_phase || "None"}</div>
 
              <div>Task:</div>
              <div>{task.task || "None"}</div>
 
              <div>Task Type:</div>
              <div>{task.task_type || "None"}</div>
 
              <div>Subtask:</div>
              <div>{task.subtask || "None"}</div>
 
              <div>Elements:</div>
              <div>{task.elements || "None"}</div>
 
              <div>Date Created:</div>
              <div>{formatDate(task.date_created)}</div>
 
              <div>Due Date:</div>
              <div>{formatDate(task.due_date)}</div>
 
              <div>Time:</div>
              <div>{task.time || "None"}</div>
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
 
            <div className="tab-content">
              {activeTab === "comments" && (
                <>
                  {/* New Comment Section */}
                  {currentUser && (
                    <div className="new-comment">
                      <div className="comment-header">
                        <div className="profile-area">
                          <div className="profile-icon">
                            {currentUser?.firstname?.[0]}{currentUser?.lastname?.[0]}
                          </div>
                          <span className="profile-name">
                            {currentUser?.firstname} {currentUser?.lastname}
                          </span>
                        </div>
                        <FaTimes className="delete-icon" onClick={clearComment} />
                      </div>
 
                      <textarea 
                        className="comment-input" 
                        placeholder="Leave a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows="4"
                        disabled={loading}
                      />
 
                      {attachment && (
                        <div className="attachment-preview">
                          <FaPaperclip />
                          <span>{attachment.name}</span>
                          <button onClick={removeAttachment} disabled={loading}>
                            <FaTimes />
                          </button>
                        </div>
                      )}
 
                      <div className="comment-actions">
                        <div className="file-input-wrapper">
                          <button className="attach-button" disabled={loading}>
                            <FaPaperclip />
                            Add Attachment
                          </button>
                          <input
                            type="file"
                            onChange={handleAttachmentChange}
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            disabled={loading}
                          />
                        </div>
                        <button 
                          className="send-button"
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || loading}
                        >
                          {loading ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
 
                  {/* Comments List */}
                  <div className="comment-section">
                    {loading && comments.length === 0 ? (
                      <div className="loading-spinner">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-profile">
                            {comment.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="comment-body">
                            <div className="comment-header-name">
                              <span className="comment-author">{comment.user}</span>
                              {comment.timestamp && (
                                <span className="comment-time">• {comment.timestamp}</span>
                              )}
                            </div>
 
                            {editingComment === comment.id ? (
                              <div>
                                <textarea
                                  className="edit-comment-input"
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  rows="3"
                                  disabled={loading}
                                />
                                <div className="comment-actions-editor">
                                  <button onClick={handleSaveEdit} disabled={loading}>
                                    {loading ? "Saving..." : "Save"}
                                  </button>
                                  <button onClick={() => setEditingComment(null)} disabled={loading}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="comment-text">{comment.text}</div>
 
                                {comment.attachment && (
                                  <a 
                                    href={comment.attachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="comment-attachment"
                                  >
                                    <FaPaperclip />
                                    {comment.attachment_name || "Download Attachment"}
                                  </a>
                                )}
 
                                {/* Comment Actions - Only show if user can edit */}
                                {canEditComment(comment) && (
                                  <div className="comment-actions-editor">
                                    <button onClick={() => handleEditComment(comment)} disabled={loading}>
                                      <FaEdit />
                                      Edit
                                    </button>
                                    <button onClick={() => handleDeleteComment(comment.id)} disabled={loading}>
                                      <FaTrash />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
 
              {activeTab === "attachment" && (
                <div className="attachment-tab">
                  <h4 style={{ color: "#5a0d0e", marginBottom: "20px" }}>Task Attachments</h4>
                  <div className="text-center py-5">
                    <FaPaperclip size={48} color="#6c757d" />
                    <p className="text-muted mt-3">No attachments yet</p>
                    <button className="attach-button mt-2">
                      <FaPaperclip />
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default AdviserViewBoard;