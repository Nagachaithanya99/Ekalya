import mongoose from "mongoose";
import Blog from "../models/Blog.js";

/* ======================================================
   PUBLIC
====================================================== */

/**
 * GET /api/blogs
 * Returns only published blogs
 */
export const getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/blogs/:id
 * Returns a single published blog
 */
export const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (!blog.published) {
      return res.status(403).json({ message: "Blog not published" });
    }

    res.json(blog);
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   ADMIN
====================================================== */

/**
 * GET /api/admin/blogs
 * Returns all blogs (draft + published)
 */
export const getAllBlogsAdmin = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/blogs
 * Create blog (always starts as draft)
 */
export const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      category = "General",
      coverImage,
      coverImageUrl,
      excerpt = "",
      content = "",
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const blog = await Blog.create({
      title: title.trim(),
      category,
      excerpt,
      content,

      // ✅ accept both names
      coverImage: coverImage || coverImageUrl || "",

      createdBy: req.user?._id,

      // ✅ ALWAYS start as draft
      published: false,
    });

    res.status(201).json(blog);
  } catch (err) {
    next(err);
  }
};


/**
 * PUT /api/admin/blogs/:id
 * Update blog content
 */
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/blogs/:id
 */
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/blogs/:id/publish
 */
export const publishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { published: true },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/blogs/:id/unpublish
 */
export const unpublishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { published: false },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (err) {
    next(err);
  }
};
