// SocialPost.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const socialPostModel = {
  /**
   * Creates a new social post.
   * @param {object} data - The data for the new social post.
   * @returns {Promise<object>} The created social post object.
   * @throws {Error} If the creation fails.
   */
  create: async (data) => {
    try {
      const socialPost = await prisma.socialPost.create({ data });
      return socialPost;
    } catch (error) {
      console.error('Error creating social post:', error);
      throw new Error('Failed to create social post.');
    }
  },

  /**
   * Finds a social post by its unique ID.
   * Includes the related campaign data.
   * @param {string} id - The unique ID of the social post.
   * @returns {Promise<object|null>} The social post object or null if not found.
   * @throws {Error} If the lookup fails.
   */
  findById: async (id) => {
    try {
      const socialPost = await prisma.socialPost.findUnique({
        where: { id },
        include: {
          campaign: true,
        },
      });
      return socialPost;
    } catch (error) {
      console.error('Error finding social post by ID:', error);
      throw new Error('Failed to find social post.');
    }
  },

  /**
   * Retrieves all social posts, optionally filtered by campaign ID.
   * Selects specific fields for a lighter payload and includes a subset of campaign data.
   * @param {string} [campaignId] - Optional campaign ID to filter posts.
   * @returns {Promise<Array<object>>} An array of social post objects.
   * @throws {Error} If the retrieval fails.
   */
  findAll: async (campaignId) => {
    try {
      const socialPosts = await prisma.socialPost.findMany({
        where: campaignId ? { campaignId } : undefined,
        select: {
          id: true,
          platform: true,
          content: true,
          publishedAt: true,
          likes: true,
          shares: true,
          comments: true,
          campaign: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      });
      return socialPosts;
    } catch (error) {
      console.error('Error finding all social posts:', error);
      throw new Error('Failed to retrieve social posts.');
    }
  },

  /**
   * Updates an existing social post.
   * @param {string} id - The unique ID of the social post to update.
   * @param {object} data - The data to update the social post with.
   * @returns {Promise<object>} The updated social post object.
   * @throws {Error} If the update fails.
   */
  update: async (id, data) => {
    try {
      const socialPost = await prisma.socialPost.update({
        where: { id },
        data,
      });
      return socialPost;
    } catch (error) {
      console.error('Error updating social post:', error);
      throw new Error('Failed to update social post.');
    }
  },

  /**
   * Deletes a social post by its unique ID.
   * @param {string} id - The unique ID of the social post to delete.
   * @returns {Promise<object>} The deleted social post object.
   * @throws {Error} If the deletion fails.
   */
  delete: async (id) => {
    try {
      const socialPost = await prisma.socialPost.delete({
        where: { id },
      });
      return socialPost;
    } catch (error) {
      console.error('Error deleting social post:', error);
      throw new Error('Failed to delete social post.');
    }
  },
};

export default socialPostModel;