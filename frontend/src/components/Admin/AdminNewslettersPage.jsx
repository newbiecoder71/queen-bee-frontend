import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const emptyDraft = {
  _id: "",
  title: "",
  imageUrl: "",
  htmlContent: "<p></p>",
};

const stripBidiControlChars = (value = "") =>
  String(value || "").replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toExcerpt = (html = "", max = 140) => {
  const plain = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}...`;
};

const fmtDate = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const AdminNewslettersPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editorLoadTick, setEditorLoadTick] = useState(0);

  const editorRef = useRef(null);
  const token = localStorage.getItem("userToken");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const loadRows = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API}/api/admin/newsletters`, { headers });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load newsletters.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showEditor || !editorRef.current) return;
    editorRef.current.innerHTML = draft.htmlContent || "<p></p>";
    editorRef.current.setAttribute("dir", "ltr");
    editorRef.current.style.direction = "ltr";
    editorRef.current.style.textAlign = "left";
  }, [showEditor, editorLoadTick]);

  const openNew = () => {
    setDraft({ ...emptyDraft });
    setShowEditor(true);
    setEditorLoadTick((n) => n + 1);
    setError("");
    setMessage("");
  };

  const openEdit = (row) => {
    setDraft({
      _id: row._id,
      title: row.title || "",
      imageUrl: row.imageUrl || "",
      htmlContent: stripBidiControlChars(row.htmlContent || "<p></p>"),
    });
    setShowEditor(true);
    setEditorLoadTick((n) => n + 1);
    setError("");
    setMessage("");
  };

  const applyCommand = (cmd, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    setDraft((prev) => ({ ...prev, htmlContent: editorRef.current.innerHTML }));
  };

  const onEditorInput = () => {
    if (!editorRef.current) return;
    const sanitized = stripBidiControlChars(editorRef.current.innerHTML || "<p></p>");
    // Do not rewrite innerHTML while typing; that can reset caret position
    // and make text appear to type in reverse.
    setDraft((prev) => ({ ...prev, htmlContent: sanitized }));
  };

  const onUploadImage = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await axios.post(`${API}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const imagePath = String(data?.imagePath || "").trim();
      const absolute =
        imagePath && imagePath.startsWith("/") ? `${API}${imagePath}` : imagePath || "";
      setDraft((prev) => ({ ...prev, imageUrl: absolute }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveDraft = async () => {
    try {
      const payload = {
        title: String(draft.title || "").trim(),
        imageUrl: String(draft.imageUrl || "").trim(),
        htmlContent: stripBidiControlChars(
          String(editorRef.current?.innerHTML || draft.htmlContent || "").trim()
        ),
      };
      if (!payload.title) {
        setError("Title is required.");
        return;
      }
      if (!payload.htmlContent || payload.htmlContent === "<p></p>") {
        setError("Please enter newsletter text.");
        return;
      }

      setSaving(true);
      setError("");
      setMessage("");

      if (draft._id) {
        await axios.put(`${API}/api/admin/newsletters/${draft._id}`, payload, { headers });
        setMessage("Newsletter updated.");
      } else {
        await axios.post(`${API}/api/admin/newsletters`, payload, { headers });
        setMessage("Newsletter created.");
      }

      await loadRows();
      setShowEditor(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to save newsletter.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row?._id) return;
    const ok = window.confirm(`Remove "${row.title || "this newsletter"}"?`);
    if (!ok) return;
    try {
      setError("");
      setMessage("");
      await axios.delete(`${API}/api/admin/newsletters/${row._id}`, { headers });
      setMessage("Newsletter removed.");
      await loadRows();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to remove newsletter.");
    }
  };

  const openPreview = (row) => {
    const title = row?.title || "Newsletter";
    const imageUrl = row?.imageUrl || "";
    const bodyHtml = row?.htmlContent || "<p></p>";
    const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    .header { display: flex; align-items: flex-start; gap: 16px; }
    .header img { width: 90px; height: 90px; object-fit: cover; border: 1px solid #e5e7eb; border-radius: 8px; }
    .title { flex: 1; text-align: center; font-weight: 700; font-size: 24px; margin-top: 6px; }
    .content { margin-top: 20px; }
    ul, ol { padding-left: 1.5rem; }
  </style>
</head>
<body>
  <div class="header">
    ${imageUrl ? `<img src="${imageUrl}" alt="Newsletter image" />` : ""}
    <div class="title">${escapeHtml(title)}</div>
  </div>
  <div class="content">${bodyHtml}</div>
</body>
</html>`;
    const width = 900;
    const height = 700;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 4));
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    const win = window.open("about:blank", "newsletterPreview", features);
    if (!win) {
      setError("Preview was blocked by the browser. Please allow pop-ups for this site.");
      return;
    }
    try {
      win.document.open("text/html", "replace");
      win.document.write(previewHtml);
      win.document.close();
    } catch (err) {
      setError("Unable to open preview window.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletters</h1>
          <p className="text-sm text-gray-600">History sorted by most recent.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded theme-primary-btn px-4 py-2 text-sm font-semibold"
        >
          New
        </button>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Loading newsletters...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No newsletters yet.</div>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row._id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-gray-900">{row.title}</div>
                    <div className="mt-1 text-sm text-gray-700">{toExcerpt(row.htmlContent, 180)}</div>
                  </div>
                  <div className="shrink-0 text-xs text-gray-500">{fmtDate(row.createdAt)}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openPreview(row)}
                    className="rounded border px-3 py-1 text-sm font-semibold hover:bg-gray-100"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    className="rounded border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-lg border bg-white p-3 sm:p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{draft._id ? "Edit Newsletter" : "New Newsletter"}</h2>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded border px-3 py-2"
                placeholder="Title"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
              <div className="flex gap-2">
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Image URL"
                  value={draft.imageUrl}
                  onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
                <label className="rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                  {uploadingImage ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUploadImage(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded border bg-gray-50 p-2 text-sm">
              <select
                className="rounded border px-2 py-1"
                onChange={(e) => applyCommand("fontName", e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Font
                </option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </select>
              <select
                className="rounded border px-2 py-1"
                onChange={(e) => applyCommand("fontSize", e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Size
                </option>
                <option value="1">10</option>
                <option value="2">13</option>
                <option value="3">16</option>
                <option value="4">18</option>
                <option value="5">24</option>
                <option value="6">32</option>
              </select>
              <label className="flex items-center gap-1 rounded border px-2 py-1">
                <span>Color</span>
                <input
                  type="color"
                  onChange={(e) => applyCommand("foreColor", e.target.value)}
                  className="h-6 w-8"
                />
              </label>
              <button type="button" onClick={() => applyCommand("bold")} className="rounded border px-2 py-1 font-bold">
                B
              </button>
              <button type="button" onClick={() => applyCommand("italic")} className="rounded border px-2 py-1 italic">
                I
              </button>
              <button type="button" onClick={() => applyCommand("underline")} className="rounded border px-2 py-1 underline">
                U
              </button>
              <button type="button" onClick={() => applyCommand("insertUnorderedList")} className="rounded border px-2 py-1">
                • List
              </button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              dir="ltr"
              suppressContentEditableWarning
              onInput={onEditorInput}
              onFocus={() => {
                if (!editorRef.current) return;
                editorRef.current.setAttribute("dir", "ltr");
                editorRef.current.style.direction = "ltr";
                editorRef.current.style.textAlign = "left";
              }}
              className="newsletter-editor mt-2 min-h-[180px] sm:min-h-[220px] rounded border p-3 text-left outline-none focus:ring-2 focus:ring-gray-300"
              style={{ direction: "ltr", unicodeBidi: "normal", textAlign: "left" }}
            />

            {draft.imageUrl && (
              <div className="mt-3">
                <img
                  src={draft.imageUrl}
                  alt="Newsletter"
                  className="max-h-44 rounded border object-cover"
                />
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="rounded theme-primary-btn px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewslettersPage;
