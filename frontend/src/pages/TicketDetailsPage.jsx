import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createComment,
  deleteComment,
  getCommentsByTicket,
  getTicketById,
  updateComment,
} from "../services/ticketApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";

const getTicketStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (["RESOLVED", "CLOSED"].includes(normalized)) {
    return "chip-success";
  }
  if (["OPEN", "IN_PROGRESS", "PENDING"].includes(normalized)) {
    return "chip-warning";
  }
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "chip-danger";
  }

  return "chip-neutral";
};

function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        getTicketById(id),
        getCommentsByTicket(id),
      ]);
      setTicket(ticketRes.data);
      setComments(commentsRes.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load ticket details.");
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      if (editingCommentId) {
        await updateComment(editingCommentId, { message: commentText });
      } else {
        await createComment({ ticketId: id, message: commentText });
      }
      setCommentText("");
      setEditingCommentId("");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete comment.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Ticket Details"
      subtitle="Inspect workflow status, attachments, and discussion"
    >
      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {ticket && (
        <section className="panel mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Ticket #{ticket.id}</h2>
            <span className={`chip ${getTicketStatusClass(ticket.status)}`}>{ticket.status}</span>
          </div>
          <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Priority:</span> {ticket.priority}</p>
          <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Description:</span> {ticket.description}</p>

          {ticket.attachments?.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-800">Attachments</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-cyan-700">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.fileName}>
                    <a href={`http://localhost:8080${attachment.fileUrl}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {attachment.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ticket.resolutionNotes && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <span className="font-medium">Resolution:</span> {ticket.resolutionNotes}
            </p>
          )}
        </section>
      )}

      <section className="panel mb-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">Comments</h3>
        <div className="grid gap-3">
          {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">{comment.message}</p>
              <small className="text-xs text-slate-500">{comment.createdAt}</small>
              <div className="mt-2 flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCommentText(comment.message);
                    setEditingCommentId(comment.id);
                  }}
                >
                  Edit
                </button>
                <button className="btn-secondary" onClick={() => handleDeleteComment(comment.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel max-w-2xl">
        <h3 className="mb-3 text-base font-semibold text-slate-900">{editingCommentId ? "Update Comment" : "Add Comment"}</h3>
        <div className="grid gap-3">
          <textarea
            className="field min-h-24"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment"
            rows={3}
          />
          <button className="btn-primary w-fit" onClick={handleSubmitComment}>
            {editingCommentId ? "Update Comment" : "Add Comment"}
          </button>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}

export default TicketDetailsPage;
