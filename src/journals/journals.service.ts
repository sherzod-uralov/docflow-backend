import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { FilterJournalDto } from './dto/filter-journal.dto';

@Injectable()
export class JournalsService {
  private readonly logger = new Logger(JournalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createJournalDto: CreateJournalDto) {
    try {
      // Check if journal with the same name already exists
      const existingJournal = await this.prisma.journal.findFirst({
        where: {
          OR: [
            { name: createJournalDto.name },
            { prefix: createJournalDto.prefix },
          ],
        },
      });

      if (existingJournal) {
        throw new ConflictException(
          existingJournal.name === createJournalDto.name
            ? `Journal with name ${createJournalDto.name} already exists`
            : `Journal with prefix ${createJournalDto.prefix} already exists`,
        );
      }

      // Create journal
      const journal = await this.prisma.journal.create({
        data: createJournalDto,
      });

      return journal;
    } catch (error) {
      this.logger.error(`Error creating journal: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create journal');
    }
  }

  async findAll(filterDto: FilterJournalDto) {
    try {
      const { name, prefix, kartoteka, skip, take, sort } = filterDto;

      // Build filter conditions
      const where: any = {};

      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }

      if (prefix) {
        where.prefix = { contains: prefix, mode: 'insensitive' };
      }

      if (kartoteka) {
        where.kartoteka = { contains: kartoteka, mode: 'insensitive' };
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
      const total = await this.prisma.journal.count({ where });

      // Get journals with pagination
      const journals = await this.prisma.journal.findMany({
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
      const transformedJournals = journals.map(journal => ({
        ...journal,
        documentCount: journal._count.documents,
        _count: undefined,
      }));

      return {
        data: transformedJournals,
        meta: {
          total,
          page: filterDto.page,
          limit: filterDto.limit,
          totalPages: Math.ceil(total / (filterDto.limit || 10)),
        },
      };
    } catch (error) {
      this.logger.error(`Error finding journals: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve journals');
    }
  }

  async findOne(id: number) {
    try {
      const journal = await this.prisma.journal.findUnique({
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
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      if (!journal) {
        throw new NotFoundException(`Journal with ID ${id} not found`);
      }

      // Transform response to include document count
      const transformedJournal = {
        ...journal,
        documentCount: journal._count.documents,
        _count: undefined,
      };

      return transformedJournal;
    } catch (error) {
      this.logger.error(`Error finding journal: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve journal');
    }
  }

  async update(id: number, updateJournalDto: UpdateJournalDto) {
    try {
      // Check if journal exists
      const existingJournal = await this.prisma.journal.findUnique({
        where: { id },
      });

      if (!existingJournal) {
        throw new NotFoundException(`Journal with ID ${id} not found`);
      }

      // Check for name or prefix conflicts if they're being updated
      if (updateJournalDto.name || updateJournalDto.prefix) {
        const conflictQuery: any = {
          OR: [],
          NOT: { id },
        };

        if (updateJournalDto.name && updateJournalDto.name !== existingJournal.name) {
          conflictQuery.OR.push({ name: updateJournalDto.name });
        }

        if (updateJournalDto.prefix && updateJournalDto.prefix !== existingJournal.prefix) {
          conflictQuery.OR.push({ prefix: updateJournalDto.prefix });
        }

        if (conflictQuery.OR.length > 0) {
          const conflictJournal = await this.prisma.journal.findFirst({
            where: conflictQuery,
          });

          if (conflictJournal) {
            throw new ConflictException(
              conflictJournal.name === updateJournalDto.name
                ? `Journal with name ${updateJournalDto.name} already exists`
                : `Journal with prefix ${updateJournalDto.prefix} already exists`,
            );
          }
        }
      }

      // Update journal
      const journal = await this.prisma.journal.update({
        where: { id },
        data: updateJournalDto,
        include: {
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      // Transform response to include document count
      const transformedJournal = {
        ...journal,
        documentCount: journal._count.documents,
        _count: undefined,
      };

      return transformedJournal;
    } catch (error) {
      this.logger.error(`Error updating journal: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update journal');
    }
  }

  async remove(id: number) {
    try {
      // Check if journal exists
      const existingJournal = await this.prisma.journal.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });

      if (!existingJournal) {
        throw new NotFoundException(`Journal with ID ${id} not found`);
      }

      // Check if journal has documents
      if (existingJournal._count.documents > 0) {
        throw new ConflictException(
          `Cannot delete journal with ID ${id} because it has ${existingJournal._count.documents} documents`,
        );
      }

      // Delete journal
      await this.prisma.journal.delete({
        where: { id },
      });

      return { message: `Journal with ID ${id} has been deleted` };
    } catch (error) {
      this.logger.error(`Error deleting journal: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete journal');
    }
  }
}
