import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaPaperclip, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { supabase } from "../../../supabaseClient";

const AdviserViewBoard = ({ task, onBack }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // current user
  useEffect(() => {
    const storedUser = localStorage.getItem("customUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  // fetch comments
  useEffect(() => {
    if (task?.id) fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          profiles:user_id ( firstname, lastname )
        `)
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((c) => ({
        id: c.id,
        user_id: c.user_id,
        user: `${c.profiles?.firstname ?? ""} ${c.profiles?.lastname ?? ""}`.trim(),
        text: c.comment_text,
        timestamp: new Date(c.created_at).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        attachment: c.attachment_url,
        attachment_name: c.attachment_name,
      }));

      setComments(formatted);
    } catch (e) {
      console.error("Error fetching comments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      setLoading(true);

      // optional upload
      let attachmentUrl = null;
      let attachmentName = null;

      if (attachment) {
        const fileExt = attachment.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `task-attachments/${task.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(filePath, attachment);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("task-attachments").getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = attachment.name;
      }

      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: task.id, // kunyare combine para ma fetch ng maayos at sigurado : task_id: task.id || t.task_name || t.task || "Untitled Task",
          
          user_id: currentUser.id,
          comment_text: newComment,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        })
        .select(`
          *,
          profiles:user_id ( firstname, lastname )
        `)
        .single();

      if (error) throw error;

      // optimistic append
      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          user_id: data.user_id,
          user: `${data.profiles?.firstname ?? ""} ${data.profiles?.lastname ?? ""}`.trim(),
          text: data.comment_text,
          timestamp: new Date(data.created_at).toLocaleString("en-US", { 
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          attachment: data.attachment_url,
          attachment_name: data.attachment_name,
        },
      ]);

      setNewComment("");
      setAttachment(null);
    } catch (e) {
      console.error("Error adding comment:", e);
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
        .update({ comment_text: editCommentText, updated_at: new Date().toISOString() })
        .eq("id", editingComment);
      if (error) throw error;

      setComments((prev) =>
        prev.map((c) => (c.id === editingComment ? { ...c, text: editCommentText } : c))
      );
      setEditingComment(null);
      setEditCommentText("");
    } catch (e) {
      console.error("Error updating comment:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      setLoading(true);
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Error deleting comment:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentChange = (e) => setAttachment(e.target.files?.[0] ?? null);
  const removeAttachment = () => setAttachment(null);
  const clearComment = () => {
    setNewComment("");
    setAttachment(null);
  };

  const canEditComment = (comment) => currentUser && comment.user_id === currentUser.id;

  const statusColors = {
    "To Do": "#FABC3F",
    "In Progress": "#809D3C",
    "To Review": "#578FCA",
    "Missed Task": "#D32F2F",
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "None") return "No Date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (!task) return null;

  return (
    <div className="container mt-4">
      <style>{`
        .tasks-layout{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
        .left-column{background:linear-gradient(135deg,#5a0d0e 0%,#8b0000 100%);color:#fff;padding:25px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .right-column{background:#f8f9fa;border-radius:12px;padding:0;border:1px solid #e9ecef;overflow:hidden}
        .info-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px}
        .info-title{font-size:1.8rem;font-weight:bold;margin-bottom:10px;text-shadow:0 2px 4px rgba(0,0,0,.3)}
        .info-status{display:flex;align-items:center;gap:8px}
        .status-dot{width:12px;height:12px;border-radius:50%;background:${statusColors[task.status]||"#6c757d"}}
        .status-text{font-weight:bold;font-size:.9rem}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}
        .info-grid>div{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.2)}
        .info-grid>div:nth-child(odd){font-weight:bold;color:#f8f9fa}
        .info-grid>div:nth-child(even){color:#fff;font-weight:500;text-align:right}
        .comment-wrap{padding:25px;max-height:600px;overflow-y:auto}
        .new-comment{background:#fff;border-radius:10px;padding:20px;margin-bottom:25px;border:1px solid #e9ecef;box-shadow:0 2px 8px rgba(0,0,0,.08)}
        .comment-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}
        .profile-area{display:flex;align-items:center;gap:10px}
        .profile-icon{width:32px;height:32px;border-radius:50%;background:#5a0d0e;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:.8rem}
        .profile-name{font-weight:bold;color:#5a0d0e}
        .delete-icon{width:20px;height:20px;cursor:pointer;opacity:.7;transition:opacity .2s}
        .delete-icon:hover{opacity:1}
        .comment-input{width:100%;border:2px solid #e9ecef;border-radius:8px;padding:12px;resize:vertical;font-size:.95rem;transition:border-color .2s;margin-bottom:15px}
        .comment-input:focus{border-color:#5a0d0e;box-shadow:0 0 0 .2rem rgba(90,13,14,.25);outline:none}
        .comment-actions{display:flex;justify-content:space-between;align-items:center}
        .attach-button{background:#6c757d;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px}
        .attach-button:hover{background:#5a6268}
        .send-button{background:#5a0d0e;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-weight:bold;cursor:pointer}
        .send-button:hover{background:#3b0304}
        .send-button:disabled{background:#6c757d;cursor:not-allowed}
        .attachment-preview{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#e9ecef;border-radius:6px;margin-bottom:15px}
        .comment-item{display:flex;gap:15px;padding:20px;border-bottom:1px solid #e9ecef;background:#fff}
        .comment-profile{width:40px;height:40px;border-radius:50%;background:#5a0d0e;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:.9rem;flex-shrink:0}
        .comment-header-name{display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .comment-author{font-weight:bold;color:#5a0d0e}
        .comment-time{color:#6c757d;font-size:.85rem}
        .comment-text{line-height:1.5;margin-bottom:10px;color:#495057}
        .comment-attachment{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;color:#5a0d0e;text-decoration:none;margin-bottom:10px}
        .comment-attachment:hover{background:#e9ecef}
        .comment-actions-editor{margin-top:12px;display:flex;gap:15px}
        .edit-comment-input{width:100%;border:2px solid #5a0d0e;border-radius:8px;padding:10px;margin-bottom:12px;font-size:.95rem;resize:vertical}
        .back-button{background:#5a0d0e;border:none;color:#fff;font-size:1rem;cursor:pointer;padding:10px 20px;border-radius:8px;margin-bottom:20px}
        .back-button:hover{background:#3b0304}
      `}</style>

      {/* Header */}
      <h2 className="text-lg font-bold" style={{ color: "#5a0d0e" }}>
        Teams Board &gt; {task.status} &gt; {task.group_name}
      </h2>
      <hr className="my-3" style={{ borderTop: "2px solid #5a0d0e" }} />

      <button className="back-button flex justify-center items-center gap-2" onClick={onBack}>
        <FaArrowLeft /> Back to Board
      </button>

      <div className="tasks-container">
        <div className="tasks-layout">
          {/* Left - task info */}
          <div className="left-column">
            <div className="info-header">
              <div className="info-title">{task.group_name || "Untitled Task"}</div>
              <div className="info-status">
                <span className="status-dot" />
                <span className="status-text">{task.status}</span>
              </div>
            </div>
            <div className="info-grid">
              <div>Group Name:</div><div>{task.group_name || "None"}</div>
              <div>Methodology:</div><div>{task.methodology || "None"}</div>
              <div>Project Phase:</div><div>{task.project_phase || "None"}</div>
              <div>Task:</div><div>{task.task || "None"}</div>
              <div>Task Type:</div><div>{task.task_type || "None"}</div>
              <div>Subtask:</div><div>{task.subtask || "None"}</div>
              <div>Elements:</div><div>{task.elements || "None"}</div>
              <div>Date Created:</div><div>{formatDate(task.date_created)}</div>
              <div>Due Date:</div><div>{formatDate(task.due_date)}</div>
              <div>Time:</div><div>{task.time || "None"}</div>
            </div>
          </div>

          {/* Right - comments only */}
          <div className="right-column">
            <div className="comment-wrap">
              {/* composer */}
              {currentUser && (
                <div className="new-comment">
                  <div className="comment-header">
                    <div className="profile-area">
                      <div className="profile-icon">
                        {currentUser?.firstname?.[0]}
                        {currentUser?.lastname?.[0]}
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
                    <label className="attach-button" style={{ cursor: loading ? "not-allowed" : "pointer" }}>
                      <FaPaperclip />
                      Add Attachment
                      <input
                        type="file"
                        onChange={handleAttachmentChange}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        disabled={loading}
                        style={{ display: "none" }}
                      />
                    </label>
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

              {/* list */}
              <div className="comment-section">
                {loading && comments.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted">No comments yet. Be the first to comment!</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-profile">
                        {comment.user.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header-name">
                          <span className="comment-author">{comment.user}</span>
                          {comment.timestamp && <span className="comment-time">• {comment.timestamp}</span>}
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

                            {currentUser && comment.user_id === currentUser.id && (
                              <div className="comment-actions-editor">
                                <button onClick={() => handleEditComment(comment)} disabled={loading}>
                                  <FaEdit /> Edit
                                </button>
                                <button onClick={() => handleDeleteComment(comment.id)} disabled={loading}>
                                  <FaTrash /> Delete
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
            </div>
          </div>
          {/* end right */}
        </div>
      </div>
    </div>
  );
};

export default AdviserViewBoard;
