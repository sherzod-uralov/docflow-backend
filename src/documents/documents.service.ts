import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto, userId: number) {
    try {
      const documentType = await this.prisma.documentType.findUnique({
        where: { id: createDocumentDto.typeId },
      });

      if (!documentType) {
        throw new NotFoundException(
          `Document type with ID ${createDocumentDto.typeId} not found`,
        );
      }

      const document = await this.prisma.document.create({
        data: {
          ...createDocumentDto,
          createdById: userId,
        },
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return document;
    } catch (error) {
      this.logger.error(
        `Error creating document: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create document');
    }
  }

  async findAll(filterDto: FilterDocumentDto, user: any) {
    try {
      const { title, typeId, journalId, hashtags, createdById, skip, take, sort } = filterDto;

      // Build filter conditions
      const where: any = {};

      if (title) {
        where.title = { contains: title, mode: 'insensitive' };
      }

      if (typeId) {
        where.typeId = typeId;
      }

      if (journalId) {
        where.journalId = journalId;
      }

      if (hashtags) {
        where.hashtags = { contains: hashtags, mode: 'insensitive' };
      }

      // Check if user is admin
      const isAdmin = user.role && user.role.name === 'admin';

      // If createdById is provided in the filter
      if (createdById) {
        // For non-admin users, ensure they can only filter by their own ID
        if (!isAdmin && createdById !== user.id) {
          this.logger.warn(`Non-admin user ${user.id} attempted to filter documents by another user's ID: ${createdById}`);
          where.createdById = user.id; // Force filter by their own ID
        } else {
          where.createdById = createdById;
        }
      } else if (!isAdmin) {
        // If no createdById filter and not admin, only show documents created by this user
        where.createdById = user.id;
      }

      // Parse sort parameter
      let orderBy: any = { createdAt: 'desc' };
      if (sort) {
        const [field, direction] = sort.split(':');
        if (field && (direction === 'asc' || direction === 'desc')) {
          orderBy = { [field]: direction };
        }
      }

      // Get total count for pagination
      const total = await this.prisma.document.count({ where });

      // Get documents with pagination
      const documents = await this.prisma.document.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          type: true,
          journal: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return {
        data: documents,
        meta: {
          total,
          page: filterDto.page || 1,
          limit: filterDto.limit || 10,
          totalPages: Math.ceil(total / (filterDto.limit || 10)),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error finding documents: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve documents');
    }
  }

  async findOne(id: number, user: any) {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check if user has permission to access this document
      const isAdmin = user.role && user.role.name === 'admin';
      if (!isAdmin && document.createdBy.id !== user.id) {
        throw new ForbiddenException('You do not have permission to access this document');
      }

      return document;
    } catch (error) {
      this.logger.error(
        `Error finding document: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve document');
    }
  }

  async update(
    id: number,
    updateDocumentDto: UpdateDocumentDto,
    userId: number,
  ) {
    try {
      // Check if document exists and get creator info
      const existingDocument = await this.prisma.document.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!existingDocument) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Get user with role info to check permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      // Check if user has permission to update this document
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const isAdmin = user.role && user.role.name === 'admin';
      if (!isAdmin && existingDocument.createdBy.id !== userId) {
        throw new ForbiddenException('You do not have permission to update this document');
      }

      // Check if document type exists if it's being updated
      if (updateDocumentDto.typeId) {
        const documentType = await this.prisma.documentType.findUnique({
          where: { id: updateDocumentDto.typeId },
        });

        if (!documentType) {
          throw new NotFoundException(
            `Document type with ID ${updateDocumentDto.typeId} not found`,
          );
        }
      }

      // Update document
      const document = await this.prisma.document.update({
        where: { id },
        data: updateDocumentDto,
        include: {
          type: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return document;
    } catch (error) {
      this.logger.error(
        `Error updating document: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update document');
    }
  }

  async remove(id: number, user: any) {
    try {
      // Check if document exists
      const existingDocument = await this.prisma.document.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!existingDocument) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      // Check if user has permission to delete this document
      const isAdmin = user.role && user.role.name === 'admin';
      if (!isAdmin && existingDocument.createdBy.id !== user.id) {
        throw new ForbiddenException('You do not have permission to delete this document');
      }

      // Delete document
      await this.prisma.document.delete({
        where: { id },
      });

      return { message: `Document with ID ${id} has been deleted` };
    } catch (error) {
      this.logger.error(
        `Error deleting document: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete document');
    }
  }
}
