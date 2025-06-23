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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { FilterJournalDto } from './dto/filter-journal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('journals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new journal' })
  @ApiResponse({
    status: 201,
    description: 'The journal has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Journal name or prefix already in use.',
  })
  create(@Body() createJournalDto: CreateJournalDto) {
    return this.journalsService.create(createJournalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all journals with filtering and pagination' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'prefix', required: false, type: String })
  @ApiQuery({ name: 'kartoteka', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'createdAt:desc' })
  @ApiResponse({
    status: 200,
    description: 'Return all journals with pagination.',
  })
  findAll(@Query() filterDto: FilterJournalDto) {
    return this.journalsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a journal by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the journal with the specified ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Journal not found.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.journalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal' })
  @ApiResponse({
    status: 200,
    description: 'The journal has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @ApiResponse({
    status: 404,
    description: 'Journal not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Journal name or prefix already in use.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJournalDto: UpdateJournalDto,
  ) {
    return this.journalsService.update(id, updateJournalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a journal' })
  @ApiResponse({
    status: 204,
    description: 'The journal has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Journal not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Journal has documents.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.journalsService.remove(id);
  }
}