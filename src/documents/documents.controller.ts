import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({
    status: 201,
    description: 'The document has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document type not found.',
  })
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentsService.create(createDocumentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents with filtering and pagination' })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'typeId', required: false, type: Number })
  @ApiQuery({ name: 'journalId', required: false, type: Number })
  @ApiQuery({ name: 'hashtags', required: false, type: String })
  @ApiQuery({ 
    name: 'createdById', 
    required: false, 
    type: Number,
    description: 'Filter documents by creator ID. Note: Non-admin users can only filter by their own ID.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'createdAt:desc' })
  @ApiResponse({
    status: 200,
    description: 'Return all documents with pagination.',
  })
  findAll(@Query() filterDto: FilterDocumentDto, @Request() req) {
    return this.documentsService.findAll(filterDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the document with the specified ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have permission to access this document.',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.documentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({
    status: 200,
    description: 'The document has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have permission to update this document.',
  })
  update( 
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, updateDocumentDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({
    status: 204,
    description: 'The document has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have permission to delete this document.',
  })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.documentsService.remove(id, req.user);
  }
}
