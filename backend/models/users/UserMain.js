// UserMain.js
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const UserMain = {
  /**
   * Creates a new user.
   * @param {object} data - The user data to create.
   * @returns {Promise<object>} The newly created user object.
   * @throws {Error} If the user creation fails.
   */
  async create(data) {
    try {
      const newUser = await prisma.userMain.create({
        data,
      });
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  /**
   * Finds a single user by their ID, including related data.
   * This is a generic finder, but for the admin controller,
   * we will use a dedicated function to select specific fields.
   * @param {string} userId - The ID of the user to find.
   * @returns {Promise<object|null>} The user object or null if not found.
   * @throws {Error} If the user retrieval fails.
   */
  async findById(userId) {
    try {
      const user = await prisma.userMain.findUnique({
        where: { id: userId },
        include: {
          companies: {
            select: {
              company: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
          subscriptions: {
            include: {
              plan: true,
            },
          },
        },
      });
      return user;
    } catch (error) {
      console.error(`Error finding user with ID ${userId}:`, error);
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  },

  /**
   * Finds a single user by their email address.
   * This is crucial for login and registration.
   * @param {string} email - The email address of the user.
   * @param {object} include - Prisma `include` options (optional).
   * @returns {Promise<object|null>} The user object or null if not found.
   */
  async findUserByEmail(email, include = null) {
    try {
      const query = { where: { email } };
      if (include) {
        query.include = include;
      } else {
        // Default include if none provided
        query.include = {
          companies: {
            select: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          credentials: {
            select: {
              passwordHash: true,
              twoFactorSecret: true,
            },
          },
        };
      }
      const user = await prisma.userMain.findUnique(query);
      return user;
    } catch (error) {
      console.error(`Error finding user with email ${email}:`, error);
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  },

  /**
   * Finds a single user by their Google ID.
   * @param {string} googleId - The Google ID of the user.
   * @param {object} include - Prisma `include` options (optional).
   * @returns {Promise<object|null>} The user object or null if not found.
   */
  async findUserByGoogleId(googleId, include = null) {
    try {
      const query = { where: { googleId } };
      if (include) {
        query.include = include;
      }
      const user = await prisma.userMain.findUnique(query);
      return user;
    } catch (error) {
      console.error(`Error finding user with Google ID ${googleId}:`, error);
      throw new Error(`Failed to find user by Google ID: ${error.message}`);
    }
  },

  /**
   * Finds a single user by their username.
   * This method is needed to check for unique usernames during registration.
   * @param {string} username - The username of the user.
   * @returns {Promise<object|null>} The user object or null if not found.
   */
  async findUserByUsername(username) {
    try {
      const user = await prisma.userMain.findUnique({
        where: { username },
        include: {
          credentials: {
            select: {
              passwordHash: true,
            },
          },
        },
      });
      return user;
    } catch (error) {
      console.error(`Error finding user with username ${username}:`, error);
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  },

  /**
   * Finds all users with optional filtering, pagination, and sorting.
   * This function combines the `findMany` and `count` logic
   * to be more efficient for the admin dashboard.
   * @param {object} options - Options for filtering, sorting, and pagination.
   * @param {object} options.where - The Prisma `where` clause.
   * @param {object} options.select - The Prisma `select` clause.
   * @param {number} options.skip - Number of users to skip.
   * @param {number} options.take - Number of users to take.
   * @param {object} options.orderBy - The Prisma `orderBy` clause.
   * @returns {Promise<{users: object[], totalUsers: number}>} An object containing the users and total count.
   */
  async findUsersAdmin({ where, select, skip, take, orderBy }) {
    try {
      const [users, totalUsers] = await prisma.$transaction([
        prisma.userMain.findMany({
          where,
          select,
          skip,
          take,
          orderBy,
        }),
        prisma.userMain.count({ where }),
      ]);
      return { users, totalUsers };
    } catch (error) {
      console.error("Error finding users for admin dashboard:", error);
      throw new Error(`Failed to find users: ${error.message}`);
    }
  },

  /**
   * Finds a single user by ID with a specific set of fields.
   * This is used by the controller to avoid returning sensitive data.
   * @param {string} userId - The ID of the user to find.
   * @param {object} select - The Prisma `select` clause.
   * @returns {Promise<object|null>} The user object with selected fields or null.
   */
  async findUserByIdWithSelect(userId, select) {
    try {
      const user = await prisma.userMain.findUnique({
        where: { id: userId },
        select,
      });
      return user;
    } catch (error) {
      console.error(`Error finding user with ID ${userId}:`, error);
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  },

  /**
   * Updates an existing user with specific fields and returns selected fields.
   * @param {string} userId - The ID of the user to update.
   * @param {object} data - The data to update the user with.
   * @param {object} select - The Prisma `select` clause.
   * @returns {Promise<object>} The updated user object with selected fields.
   * @throws {Error} If the user update fails.
   */
  async updateUserWithSelect(userId, data, select) {
    try {
      const updatedUser = await prisma.userMain.update({
        where: { id: userId },
        data,
        select,
      });
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  /**
   * Deletes a user by their ID.
   * @param {string} userId - The ID of the user to delete.
   * @returns {Promise<object>} The deleted user object.
   * @throws {Error} If the user deletion fails.
   */
  async remove(userId) {
    try {
      const deletedUser = await prisma.userMain.delete({
        where: { id: userId },
      });
      return deletedUser;
    } catch (error) {
      console.error(`Error deleting user with ID ${userId}:`, error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },
};

export default UserMain;