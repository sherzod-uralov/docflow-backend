import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { FilterDocumentTypeDto } from './dto/filter-document-type.dto';

@Injectable()
export class DocumentTypesService {
  private readonly logger = new Logger(DocumentTypesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDocumentTypeDto: CreateDocumentTypeDto) {
    try {
      // Check if document type with the same name already exists
      const existingDocumentType = await this.prisma.documentType.findUnique({
        where: { name: createDocumentTypeDto.name },
      });

      if (existingDocumentType) {
        throw new ConflictException(
          `Document type with name ${createDocumentTypeDto.name} already exists`,
        );
      }

      // Create document type
      return await this.prisma.documentType.create({
        data: createDocumentTypeDto,
      });
    } catch (error) {
      this.logger.error(`Error creating document type: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create document type');
    }
  }

  async findAll(filterDto: FilterDocumentTypeDto) {
    try {
      const { name, skip, take, sort } = filterDto;

      // Build filter conditions
      const where: any = {};

      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
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
      const total = await this.prisma.documentType.count({ where });

      // Get document types with pagination
      const documentTypes = await this.prisma.documentType.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      // Transform response to include document count
      const transformedDocumentTypes = documentTypes.map(documentType => ({
        ...documentType,
        documentCount: documentType._count.documents,
        _count: undefined,
      }));

      return {
        data: transformedDocumentTypes,
        meta: {
          total,
          page: filterDto.page,
          limit: filterDto.limit,
          totalPages: Math.ceil(total / (filterDto.limit || 10)),
        },
      };
    } catch (error) {
      this.logger.error(`Error finding document types: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve document types');
    }
  }

  async findOne(id: number) {
    try {
      const documentType = await this.prisma.documentType.findUnique({
        where: { id },
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!documentType) {
        throw new NotFoundException(`Document type with ID ${id} not found`);
      }

      return documentType;
    } catch (error) {
      this.logger.error(`Error finding document type: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve document type');
    }
  }

  async update(id: number, updateDocumentTypeDto: UpdateDocumentTypeDto) {
    try {
      // Check if document type exists
      const existingDocumentType = await this.prisma.documentType.findUnique({
        where: { id },
      });

      if (!existingDocumentType) {
        throw new NotFoundException(`Document type with ID ${id} not found`);
      }

      // Check if name is unique if it's being updated
      if (
        updateDocumentTypeDto.name &&
        updateDocumentTypeDto.name !== existingDocumentType.name
      ) {
        const documentTypeWithSameName = await this.prisma.documentType.findUnique({
          where: { name: updateDocumentTypeDto.name },
        });

        if (documentTypeWithSameName) {
          throw new ConflictException(
            `Document type with name ${updateDocumentTypeDto.name} already exists`,
          );
        }
      }

      // Update document type
      return await this.prisma.documentType.update({
        where: { id },
        data: updateDocumentTypeDto,
      });
    } catch (error) {
      this.logger.error(`Error updating document type: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update document type');
    }
  }

  async remove(id: number) {
    try {
      // Check if document type exists
      const existingDocumentType = await this.prisma.documentType.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      if (!existingDocumentType) {
        throw new NotFoundException(`Document type with ID ${id} not found`);
      }

      // Check if document type is used by any documents
      if (existingDocumentType._count.documents > 0) {
        throw new ConflictException(
          `Cannot delete document type with ID ${id} because it is used by ${existingDocumentType._count.documents} documents`,
        );
      }

      // Delete document type
      await this.prisma.documentType.delete({
        where: { id },
      });

      return { message: `Document type with ID ${id} has been deleted` };
    } catch (error) {
      this.logger.error(`Error deleting document type: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete document type');
    }
  }
}
