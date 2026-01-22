const asyncHandler = require('express-async-handler');
const prisma = require('../utils/prismaClient'); // Use the shared prisma client
const { GroupRole } = require('@prisma/client');
const ErrorResponse = require('../utils/errorResponse'); // Assuming you have a standard ErrorResponse utility

/**
 * @desc    Create a new group within the active tenant
 * @route   POST /api/tenant/groups
 * @access  Private (Requires Company ADMIN role)
 */
const createGroup = asyncHandler(async (req, res) => {
  const companyId = req.company.id; // From tenant resolver middleware
  const { name, description } = req.body;
  const requestingUserId = req.user.id; // From 'protect' middleware

  if (!name) {
    throw new ErrorResponse('Group name is required.', 400);
  }

  // Create the group and automatically add the creator as the first Group Manager
  const newGroup = await prisma.group.create({
    data: {
      name,
      description,
      company: { connect: { id: companyId } }, // Connect to the tenant
      members: {
        create: {
          userId: requestingUserId,
          role: GroupRole.MANAGER, // The creator becomes the first manager
          assignedBy: requestingUserId,
        },
      },
    },
    include: {
      // Include the new member in the response
      members: {
        select: {
          user: {
            select: { id: true, name: true, email: true },
          },
          role: true,
        },
      },
    },
  });

  res.status(201).json(newGroup);
});

/**
 * @desc    Get all groups for the active tenant
 * @route   GET /api/tenant/groups
 * @access  Private (Requires Company MEMBER role or higher)
 */
const getGroups = asyncHandler(async (req, res) => {
  const companyId = req.company.id; // From tenant resolver middleware

  const groups = await prisma.group.findMany({
    where: {
      companyId,
    },
    include: {
      // Include member count for the frontend UI
      _count: {
        select: { members: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.status(200).json(groups);
});

/**
 * @desc    Get a single group by ID for the active tenant
 * @route   GET /api/tenant/groups/:groupId
 * @access  Private (Requires Company MEMBER role or higher)
 */
const getGroupById = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const companyId = req.company.id; // from tenant resolver

    const group = await prisma.group.findFirst({
        where: {
            id: groupId,
            companyId: companyId, // Ensure group belongs to the tenant
        },
        include: {
            members: {
                select: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    role: true,
                    assignedAt: true,
                },
                orderBy: {
                   user: {
                    name: 'asc',
                   }
                }
            },
            _count: {
                select: { members: true },
            },
        },
    });

    if (!group) {
        throw new ErrorResponse(`Group not found with id of ${groupId}`, 404);
    }

    res.status(200).json(group);
});

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
};
