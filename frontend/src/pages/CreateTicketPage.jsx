import { useEffect, useMemo, useState } from "react";
import { createTicket, uploadTicketAttachments } from "../services/ticketApi";
import { getAllResources } from "../services/resourceApi";
import AuthenticatedLayout from "../components/common/AuthenticatedLayout";
import StyledSelect from "../components/common/StyledSelect";
import FloatingToast from "../components/common/FloatingToast";

const resourceCategoryOptions = [
  { value: "", label: "All Categories" },
  { value: "LECTURE_HALL", label: "Lecture Hall" },
  { value: "LAB", label: "Lab" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EQUIPMENT", label: "Equipment" },
];

const issueCategoryOptions = [
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "NETWORK", label: "Network" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "OTHER", label: "Other" },
];

function CreateTicketPage() {
  const [form, setForm] = useState({
    resourceId: "",
    category: "ELECTRICAL",
    description: "",
    priority: "MEDIUM",
    contactDetails: "",
  });
  const [resources, setResources] = useState([]);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadResources = async () => {
      setLoadingResources(true);

      try {
        const res = await getAllResources({ status: "ACTIVE" });
        setResources(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load resources.");
      } finally {
        setLoadingResources(false);
      }
    };

    void loadResources();
  }, []);

  const categoryDropdownOptions = useMemo(() => {
    const knownTypes = new Set(resourceCategoryOptions.map((option) => option.value));
    const dynamicTypes = Array.from(
      new Set(resources.map((resource) => resource.type).filter(Boolean))
    )
      .filter((type) => !knownTypes.has(type))
      .map((type) => ({ value: type, label: type }));

    return [...resourceCategoryOptions, ...dynamicTypes];
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!selectedResourceCategory) {
      return resources;
    }

    return resources.filter((resource) => resource.type === selectedResourceCategory);
  }, [resources, selectedResourceCategory]);

  const resourceOptions = useMemo(
    () =>
      filteredResources.map((resource) => ({
        value: resource.id,
        label: resource.name || "Unnamed Resource",
      })),
    [filteredResources]
  );

  useEffect(() => {
    if (!form.resourceId) {
      return;
    }

    const stillExists = filteredResources.some((resource) => resource.id === form.resourceId);
    if (!stillExists) {
      setForm((prev) => ({ ...prev, resourceId: "" }));
    }
  }, [filteredResources, form.resourceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ticketRes = await createTicket(form);

      if (files.length > 0) {
        await uploadTicketAttachments(ticketRes.data.id, files);
      }

      showToast("Ticket created successfully.");
      setError("");
      setFiles([]);
      setSelectedResourceCategory("");
      setForm({
        resourceId: "",
        category: "ELECTRICAL",
        description: "",
        priority: "MEDIUM",
        contactDetails: "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create ticket.");
    }
  };

  return (
    <AuthenticatedLayout
      title="Create Incident Ticket"
      subtitle="Report maintenance issues and upload evidence for faster resolution"
    >
      <section className="panel max-w-3xl">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource Category</label>
            <StyledSelect
              className="w-full"
              name="resourceCategory"
              value={selectedResourceCategory}
              onChange={(event) => setSelectedResourceCategory(event.target.value)}
              options={categoryDropdownOptions}
              disabled={loadingResources}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource</label>
            <StyledSelect
              className="w-full"
              name="resourceId"
              value={form.resourceId}
              onChange={handleChange}
              options={resourceOptions}
              placeholder={loadingResources ? "Loading resources..." : "Select resource"}
              searchable
              searchPlaceholder="Search by resource name"
              disabled={loadingResources || resourceOptions.length === 0}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Category</label>
            <StyledSelect
              className="w-full"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={issueCategoryOptions}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <StyledSelect
              className="w-full"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              options={[
                { value: "LOW", label: "LOW" },
                { value: "MEDIUM", label: "MEDIUM" },
                { value: "HIGH", label: "HIGH" },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Contact</label>
            <input className="field" name="contactDetails" value={form.contactDetails} onChange={handleChange} placeholder="Email or phone" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Description</label>
            <textarea
              className="field min-h-28"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what happened, where, and impact"
              rows={4}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Evidence Images (max 3)</label>
            <input
              className="field"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 3) {
                  setError("You can upload up to 3 images.");
                  return;
                }
                setError("");
                setFiles(selected);
              }}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="sm:col-span-2">
            <button className="btn-primary" type="submit">Submit Ticket</button>
          </div>
        </form>
      </section>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <FloatingToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </AuthenticatedLayout>
  );
}

export default CreateTicketPage;
