import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/Loader";
import {
  getBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from "../../services/blogService";
import { useUploadService } from "../../services/uploadService";

export default function Blogs() {
  const { uploadFile } = useUploadService();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [coverFile, setCoverFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "General",
    coverImage: "",
    excerpt: "",
    content: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getBlogsAdmin();
      setBlogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const s = new Set(["All", "General"]);
    blogs.forEach((b) => s.add(b.category || "General"));
    return [...s];
  }, [blogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogs
      .filter((b) =>
        categoryFilter === "All"
          ? true
          : (b.category || "General") === categoryFilter
      )
      .filter((b) =>
        q
          ? `${b.title} ${b.excerpt} ${b.content}`
              .toLowerCase()
              .includes(q)
          : true
      );
  }, [blogs, search, categoryFilter]);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setCoverFile(null);
    setForm({
      title: "",
      category: "General",
      coverImage: "",
      excerpt: "",
      content: "",
    });
  };

  const fillEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title || "",
      category: b.category || "General",
      coverImage: b.coverImage || "",
      excerpt: b.excerpt || "",
      content: b.content || "",
    });
  };

  const uploadCover = async () => {
    if (!coverFile) return alert("Select image first");
    setUploading(true);
    try {
      const url = await uploadFile(coverFile, "image");
      setForm((p) => ({ ...p, coverImage: url }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim())
      return alert("Title and content required");

    setSaving(true);
    try {
      editingId
        ? await updateBlog(editingId, form)
        : await createBlog(form);

      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete blog?")) return;
    await deleteBlog(id);
    await load();
  };

  const publish = async (id) => {
    await publishBlog(id);
    await load();
  };

  const unpublish = async (id) => {
    await unpublishBlog(id);
    await load();
  };

  if (loading) return <Loader label="Loading blogs..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Manage <span className="text-gold">Blogs</span>
      </h1>

      {/* CREATE / EDIT */}
      <div className="glass p-5 rounded-2xl">
        <form onSubmit={submit} className="grid gap-4">
          <Input label="Title" name="title" value={form.title} onChange={onChange} />
          <Input label="Category" name="category" value={form.category} onChange={onChange} />

          <Input
            label="Cover Image URL"
            name="coverImage"
            value={form.coverImage}
            onChange={onChange}
          />

          <input type="file" onChange={(e) => setCoverFile(e.target.files[0])} />
          <button type="button" onClick={uploadCover} disabled={uploading}>
            Upload Cover
          </button>

          <Textarea label="Excerpt" name="excerpt" value={form.excerpt} onChange={onChange} />
          <Textarea
            label="Content"
            name="content"
            value={form.content}
            onChange={onChange}
            rows={8}
          />

          <button disabled={saving} className="btn-gold">
            {editingId ? "Update Blog" : "Create Blog"}
          </button>
        </form>
      </div>

      {/* BLOG LIST */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((b) => (
            <motion.div key={b._id} className="glass p-4 rounded-2xl">
              <h3 className="font-bold">{b.title}</h3>
              <p className="text-sm text-white/60">{b.excerpt}</p>

              <div className="mt-3 flex gap-2">
                <button onClick={() => fillEdit(b)}>Edit</button>

                {b.published ? (
                  <button onClick={() => unpublish(b._id)} className="bg-yellow-500">
                    Unpublish
                  </button>
                ) : (
                  <button onClick={() => publish(b._id)} className="bg-green-500">
                    Publish
                  </button>
                )}

                <button onClick={() => remove(b._id)} className="bg-red-500">
                  Delete
                </button>
              </div>

              <p className="mt-2 text-xs">
                Status:{" "}
                <span className={b.published ? "text-green-400" : "text-yellow-300"}>
                  {b.published ? "Published" : "Draft"}
                </span>
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span>{label}</span>
      <input {...props} className="w-full p-2 rounded bg-black/40" />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="block">
      <span>{label}</span>
      <textarea {...props} className="w-full p-2 rounded bg-black/40" />
    </label>
  );
}
