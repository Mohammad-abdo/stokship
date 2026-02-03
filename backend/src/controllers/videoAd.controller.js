const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get all video ads
// @route   GET /api/video-ads
// @access  Public
const getVideoAds = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;

  const where = activeOnly === 'true' ? { isActive: true } : {};

  try {
    const videoAds = await prisma.videoAd.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { videoAdLikes: true, videoAdComments: true }
        }
      }
    });

    const payload = videoAds.map((ad) => {
      const { _count, ...rest } = ad;
      return {
        ...rest,
        likes: rest.likes ?? _count?.videoAdLikes ?? 0,
        dislikes: rest.dislikes ?? 0,
        commentsCount: _count?.videoAdComments ?? 0
      };
    });

    return successResponse(res, payload, 'Video ads retrieved successfully');
  } catch (err) {
    const videoAds = await prisma.videoAd.findMany({
      where,
      orderBy: { displayOrder: 'asc' }
    });
    const payload = videoAds.map((ad) => ({
      ...ad,
      likes: ad.likes ?? 0,
      dislikes: ad.dislikes ?? 0,
      commentsCount: 0
    }));
    return successResponse(res, payload, 'Video ads retrieved successfully');
  }
});

// @desc    Get video ad by ID
// @route   GET /api/video-ads/:id
// @access  Public
const getVideoAdById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { incrementView = 'true', likerId } = req.query;

  try {
    const existing = await prisma.videoAd.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Video ad not found', 404);
    }

    const shouldIncrementView = incrementView === 'true' || incrementView === true;

    const [videoAd, hasLikedRecord, hasDislikedRecord] = await Promise.all([
      shouldIncrementView
        ? prisma.videoAd.update({
            where: { id },
            data: { views: { increment: 1 } },
            include: {
              _count: {
                select: { videoAdLikes: true, videoAdComments: true }
              }
            }
          })
        : prisma.videoAd.findUnique({
            where: { id },
            include: {
              _count: {
                select: { videoAdLikes: true, videoAdComments: true }
              }
            }
          }),
      likerId
        ? prisma.videoAdLike.findUnique({
            where: {
              videoAdId_likerId: { videoAdId: id, likerId: String(likerId) }
            }
          })
        : null,
      likerId && typeof prisma.videoAdDislike !== 'undefined'
        ? prisma.videoAdDislike.findUnique({
            where: {
              videoAdId_dislikerId: { videoAdId: id, dislikerId: String(likerId) }
            }
          })
        : null
    ]);

    if (!videoAd) {
      return errorResponse(res, 'Video ad not found', 404);
    }

    const { _count, ...rest } = videoAd;
    const payload = {
      ...rest,
      likes: rest.likes ?? _count?.videoAdLikes ?? 0,
      dislikes: rest.dislikes ?? 0,
      commentsCount: _count?.videoAdComments ?? 0,
      hasLiked: !!hasLikedRecord,
      hasDisliked: !!hasDislikedRecord
    };

    return successResponse(res, payload, 'Video ad retrieved successfully');
  } catch (err) {
    const existing = await prisma.videoAd.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Video ad not found', 404);
    }
    const videoAd = await prisma.videoAd.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
    return successResponse(res, videoAd, 'Video ad retrieved successfully');
  }
});

// @desc    Toggle like on video ad
// @route   POST /api/video-ads/:id/like
// @access  Public
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { likerId } = req.body;

  if (!likerId) {
    return errorResponse(res, 'likerId is required', 400);
  }

  const videoAd = await prisma.videoAd.findUnique({ where: { id } });
  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  const existing = await prisma.videoAdLike.findUnique({
    where: {
      videoAdId_likerId: { videoAdId: id, likerId: String(likerId) }
    }
  });

  if (existing) {
    await prisma.videoAdLike.delete({
      where: {
        videoAdId_likerId: { videoAdId: id, likerId: String(likerId) }
      }
    });
    await prisma.videoAd.update({
      where: { id },
      data: { likes: { decrement: 1 } }
    });
    return successResponse(res, { liked: false, likes: Math.max(0, (videoAd.likes || 0) - 1) }, 'Like removed');
  }

  await prisma.videoAdLike.create({
    data: {
      videoAdId: id,
      likerId: String(likerId)
    }
  });
  await prisma.videoAd.update({
    where: { id },
    data: { likes: { increment: 1 } }
  });

  return successResponse(res, { liked: true, likes: (videoAd.likes || 0) + 1 }, 'Like added');
});

// @desc    Toggle dislike on video ad
// @route   POST /api/video-ads/:id/dislike
// @access  Public
const toggleDislike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dislikerId } = req.body;

  if (!dislikerId) {
    return errorResponse(res, 'dislikerId is required', 400);
  }

  if (!prisma.videoAdDislike) {
    return errorResponse(res, 'Dislike service unavailable.', 503);
  }

  const videoAd = await prisma.videoAd.findUnique({ where: { id } });
  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  const existing = await prisma.videoAdDislike.findUnique({
    where: {
      videoAdId_dislikerId: { videoAdId: id, dislikerId: String(dislikerId) }
    }
  });

  if (existing) {
    await prisma.videoAdDislike.delete({
      where: {
        videoAdId_dislikerId: { videoAdId: id, dislikerId: String(dislikerId) }
      }
    });
    await prisma.videoAd.update({
      where: { id },
      data: { dislikes: { decrement: 1 } }
    });
    return successResponse(res, { disliked: false, dislikes: Math.max(0, (videoAd.dislikes || 0) - 1) }, 'Dislike removed');
  }

  await prisma.videoAdDislike.create({
    data: {
      videoAdId: id,
      dislikerId: String(dislikerId)
    }
  });
  await prisma.videoAd.update({
    where: { id },
    data: { dislikes: { increment: 1 } }
  });

  return successResponse(res, { disliked: true, dislikes: (videoAd.dislikes || 0) + 1 }, 'Dislike added');
});

// @desc    Get comments for video ad (with nested replies)
// @route   GET /api/video-ads/:id/comments
// @access  Public
const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!prisma.videoAdComment) {
    return errorResponse(res, 'Comments service unavailable. Run: npx prisma generate and restart the server.', 503);
  }

  const videoAd = await prisma.videoAd.findUnique({ where: { id } });
  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  try {
    const allComments = await prisma.videoAdComment.findMany({
      where: { videoAdId: id },
      orderBy: { createdAt: 'asc' }
    });
    // بناء شجرة: تعليقات رئيسية مع ردودها (مثل فيسبوك)
    const byParent = new Map();
    allComments.forEach((c) => {
      const pid = c.parentId || '_root';
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(c);
    });
    const buildTree = (parentId) => {
      const list = byParent.get(parentId) || [];
      return list.map((c) => ({
        ...c,
        replies: buildTree(c.id)
      }));
    };
    const comments = buildTree('_root');
    return successResponse(res, comments, 'Comments retrieved successfully');
  } catch (err) {
    const logger = require('../utils/logger').logger;
    logger.error('getComments error:', err);
    return errorResponse(
      res,
      process.env.NODE_ENV === 'development' ? (err.message || 'Failed to load comments') : 'Failed to load comments',
      500
    );
  }
});

// @desc    Add comment to video ad
// @route   POST /api/video-ads/:id/comments
// @access  Public
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, parentId } = req.body;

  if (!prisma.videoAdComment) {
    return errorResponse(res, 'Comments service unavailable. Run: npx prisma generate and restart the server.', 503);
  }

  if (!text || !String(text).trim()) {
    return errorResponse(res, 'Comment text is required', 400);
  }

  const videoAd = await prisma.videoAd.findUnique({ where: { id } });
  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  if (parentId) {
    const parent = await prisma.videoAdComment.findFirst({
      where: { id: parentId, videoAdId: id }
    });
    if (!parent) {
      return errorResponse(res, 'Parent comment not found', 404);
    }
  }

  try {
    const comment = await prisma.videoAdComment.create({
      data: {
        videoAdId: id,
        parentId: parentId && String(parentId).trim() ? String(parentId).trim() : null,
        text: String(text).trim()
      }
    });
    return successResponse(res, comment, 'Comment added successfully', 201);
  } catch (err) {
    const logger = require('../utils/logger').logger;
    logger.error('addComment error:', err);
    return errorResponse(
      res,
      process.env.NODE_ENV === 'development' ? (err.message || 'Failed to save comment') : 'Failed to save comment',
      500
    );
  }
});

// @desc    Increment link click count
// @route   POST /api/video-ads/:id/link-click
// @access  Public
const incrementLinkClick = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const videoAd = await prisma.videoAd.findUnique({ where: { id } });
  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  await prisma.videoAd.update({
    where: { id },
    data: { linkClicks: { increment: 1 } }
  });

  return successResponse(res, { ok: true }, 'Link click recorded');
});

// @desc    Create video ad
// @route   POST /api/video-ads
// @access  Private (Admin)
const createVideoAd = asyncHandler(async (req, res) => {
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    contentAr,
    contentEn,
    videoUrl,
    thumbnailUrl,
    linkUrl,
    displayOrder,
    isActive
  } = req.body;

  if (!titleAr || !titleEn || !videoUrl) {
    return errorResponse(res, 'Title (Arabic and English) and video URL are required', 400);
  }

  const videoAd = await prisma.videoAd.create({
    data: {
      titleAr,
      titleEn,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      contentAr: contentAr || null,
      contentEn: contentEn || null,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      linkUrl: linkUrl || null,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true
    }
  });

  successResponse(res, videoAd, 'Video ad created successfully', 201);
});

// @desc    Update video ad
// @route   PUT /api/video-ads/:id
// @access  Private (Admin)
const updateVideoAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    contentAr,
    contentEn,
    videoUrl,
    thumbnailUrl,
    linkUrl,
    displayOrder,
    isActive
  } = req.body;

  const existingVideoAd = await prisma.videoAd.findUnique({
    where: { id }
  });

  if (!existingVideoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  const data = {};
  if (titleAr !== undefined) data.titleAr = titleAr;
  if (titleEn !== undefined) data.titleEn = titleEn;
  if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
  if (descriptionEn !== undefined) data.descriptionEn = descriptionEn;
  if (contentAr !== undefined) data.contentAr = contentAr;
  if (contentEn !== undefined) data.contentEn = contentEn;
  if (videoUrl !== undefined) data.videoUrl = videoUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (linkUrl !== undefined) data.linkUrl = linkUrl;
  if (displayOrder !== undefined) data.displayOrder = parseInt(displayOrder);
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

  const updatedVideoAd = await prisma.videoAd.update({
    where: { id },
    data
  });

  successResponse(res, updatedVideoAd, 'Video ad updated successfully');
});

// @desc    Delete video ad
// @route   DELETE /api/video-ads/:id
// @access  Private (Admin)
const deleteVideoAd = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const videoAd = await prisma.videoAd.findUnique({
    where: { id }
  });

  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  await prisma.videoAd.delete({
    where: { id }
  });

  successResponse(res, null, 'Video ad deleted successfully');
});

module.exports = {
  getVideoAds,
  getVideoAdById,
  toggleLike,
  toggleDislike,
  getComments,
  addComment,
  incrementLinkClick,
  createVideoAd,
  updateVideoAd,
  deleteVideoAd
};
