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
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { FilterDocumentTypeDto } from './dto/filter-document-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { HasPermission } from '../common/decorators/has-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';


@ApiTags('document-types')
@ApiBearerAuth()
@UseGuards(PermissionsGuard,JwtAuthGuard)
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document type' })
  @ApiResponse({
    status: 201,
    description: 'The document type has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Document type name already in use.',
  })
  @HasPermission('document-types:create')
  create(@Body() createDocumentTypeDto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(createDocumentTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document types with filtering and pagination' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'createdAt:desc' })
  @ApiResponse({
    status: 200,
    description: 'Return all document types with pagination.',
  })
  @HasPermission('document-types:read')
  findAll(@Query() filterDto: FilterDocumentTypeDto) {
    return this.documentTypesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the document type with the specified ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document type not found.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document type' })
  @ApiResponse({
    status: 200,
    description: 'The document type has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document type not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Document type name already in use.',
  })
  @HasPermission('document-types:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentTypeDto: UpdateDocumentTypeDto,
  ) {
    return this.documentTypesService.update(id, updateDocumentTypeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document type' })
  @ApiResponse({
    status: 204,
    description: 'The document type has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Document type not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Document type is used by documents.',
  })
  @HasPermission('document-types:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentTypesService.remove(id);
  }
}
