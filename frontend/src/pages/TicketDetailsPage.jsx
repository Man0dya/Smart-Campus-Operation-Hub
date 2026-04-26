import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createComment,
  deleteComment,
  getCommentsByTicket,
  getTicketById,
  postTicketResponse,
  updateComment,
} from "../services/ticketApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import PaginationControls from "../components/common/PaginationControls";
import AuthContext from "../context/auth-context";
import {
  HiOutlineCog6Tooth,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const apiOrigin = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";

const getTicketStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (["RESOLVED", "CLOSED"].includes(normalized)) {
    return "chip-success";
  }
  if (["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING"].includes(normalized)) {
    return "chip-warning";
  }
  if (["REJECTED", "CANCELLED", "CANCELED"].includes(normalized)) {
    return "chip-danger";
  }

  return "chip-neutral";
};

const formatTimestamp = (ts) => {
  if (!ts) return "";
  try {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
};

function TicketDetailsPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [responseText, setResponseText] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [responseError, setResponseError] = useState("");
  const [commentFilter, setCommentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    if (commentText.trim().length > 1500) {
      setCommentError("Comment must be less than 1500 characters.");
      return;
    }
    setCommentError("");

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

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      setResponseError("Response cannot be empty.");
      return;
    }
    if (responseText.trim().length > 1500) {
      setResponseError("Response must be less than 1500 characters.");
      return;
    }
    setResponseError("");

    setResponseLoading(true);
    try {
      await postTicketResponse(id, { response: responseText.trim() });
      setResponseText("");
      await loadData();
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit response.");
    } finally {
      setResponseLoading(false);
    }
  };

  const filteredComments = useMemo(() => {
    const query = commentFilter.trim().toLowerCase();

    if (!query) {
      return comments;
    }

    return comments.filter((comment) => {
      const haystack = [comment.message, comment.createdAt].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [comments, commentFilter]);

  useEffect(() => {
    setPage(1);
  }, [commentFilter, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredComments.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredComments.length, page, pageSize]);

  const paginatedComments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredComments.slice(start, start + pageSize);
  }, [filteredComments, page, pageSize]);

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
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Priority:</span> {ticket.priority}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Category:</span> {ticket.category || "N/A"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Reporter:</span> {ticket.reportedBy || "Unknown"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Assigned To:</span> {ticket.assignedTo || "Unassigned"}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Created:</span> {formatTimestamp(ticket.createdAt)}</p>
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Last Updated:</span> {formatTimestamp(ticket.updatedAt)}</p>
          </div>
          <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Description:</span> {ticket.description}</p>

          {ticket.attachments?.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-800">Attachments</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-cyan-700">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.publicId ?? attachment.fileUrl ?? attachment.fileName}>
                    <a
                      href={
                        attachment.fileUrl?.startsWith("http")
                          ? attachment.fileUrl
                          : `${apiOrigin}${attachment.fileUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {attachment.fileName ?? "Attachment"}
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

          {ticket.technicianResponse && (
            <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
              <p className="mb-1 text-sm font-semibold text-slate-900">Technician Response</p>
              <p>{ticket.technicianResponse}</p>
            </div>
          )}

          {user?.role === "TECHNICIAN" && ticket?.assignedTo === user?.id && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm font-semibold text-slate-900">Add response to ticket</p>
              <textarea
                className={`field min-h-24 ${responseError ? "border-rose-400 focus:border-rose-400" : ""}`}
                value={responseText}
                onChange={(e) => {
                  setResponseText(e.target.value);
                  if (responseError) setResponseError("");
                }}
                placeholder="Write a response or update for the ticket requester"
                rows={4}
              />
              {responseError && <p className="mt-1 text-xs text-rose-600">{responseError}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-primary"
                  onClick={handleSubmitResponse}
                  disabled={responseLoading}
                >
                  {responseLoading ? "Sending..." : "Send Response"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Comments / Ticket Thread */}
      <section className="panel mb-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">Ticket Thread</h3>
        <div className="mb-3">
          <input
            className="field"
            placeholder="Filter comments"
            value={commentFilter}
            onChange={(event) => setCommentFilter(event.target.value)}
          />
        </div>
        <div className="grid gap-3">
          {filteredComments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          {paginatedComments.map((comment) => {
            const isSystem = comment.systemGenerated;
            const isOwn = comment.userId === user?.id;

            if (isSystem) {
              // System-generated comment: distinct styling, no edit/delete
              return (
                <article
                  key={comment.id}
                  className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50 p-3"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <HiOutlineCog6Tooth className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">System</p>
                    <p className="mt-0.5 text-sm text-slate-700">{comment.message}</p>
                    <small className="text-xs text-slate-400">{formatTimestamp(comment.createdAt)}</small>
                  </div>
                </article>
              );
            }

            // Human comment: regular styling with edit/delete for own comments
            return (
              <article key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {comment.userId === user?.id ? "You" : comment.userId}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <small className="text-xs text-slate-400">{formatTimestamp(comment.createdAt)}</small>
                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs italic text-slate-400">(edited)</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{comment.message}</p>
                {isOwn && (
                  <div className="mt-2 flex gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                      onClick={() => {
                        setCommentText(comment.message);
                        setEditingCommentId(comment.id);
                      }}
                    >
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filteredComments.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200">
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={filteredComments.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        )}
      </section>

      {/* Add Comment Form */}
      <section className="panel max-w-2xl">
        <h3 className="mb-3 text-base font-semibold text-slate-900">{editingCommentId ? "Update Comment" : "Add Comment"}</h3>
        <div className="grid gap-3">
          <textarea
            className={`field min-h-24 ${commentError ? "border-rose-400 focus:border-rose-400" : ""}`}
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentError) setCommentError("");
            }}
            placeholder="Write a comment"
            rows={3}
          />
          {commentError && <p className="mt-1 text-xs text-rose-600">{commentError}</p>}
          <div className="flex gap-2">
            <button className="btn-primary w-fit" onClick={handleSubmitComment}>
              {editingCommentId ? "Update Comment" : "Add Comment"}
            </button>
            {editingCommentId && (
              <button
                className="btn-secondary w-fit"
                onClick={() => {
                  setCommentText("");
                  setEditingCommentId("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}

export default TicketDetailsPage;
