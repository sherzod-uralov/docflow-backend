import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { DepartmentHierarchyChartDto } from './dto/department-hierarchy-chart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { HasPermission } from '../common/decorators/has-permission.decorator';

@ApiTags('departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'The department has been successfully created.',
    type: DepartmentResponseDto,
  })
  @HasPermission('departments:create')
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: 200,
    description: 'Returns all departments',
    type: [DepartmentResponseDto],
  })
  @HasPermission('departments:read')
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get department hierarchy tree' })
  @ApiResponse({
    status: 200,
    description: 'Returns the department hierarchy as a tree structure',
    type: [DepartmentResponseDto],
  })
  @HasPermission('departments:read')
  getDepartmentHierarchy() {
    return this.departmentsService.getDepartmentHierarchy();
  }

  @Get('hierarchy/chart')
  @ApiOperation({ summary: 'Get department hierarchy formatted for chart visualization' })
  @ApiResponse({
    status: 200,
    description: 'Returns the department hierarchy formatted for chart visualization',
    type: DepartmentHierarchyChartDto,
  })
  @HasPermission('departments:read')
  getDepartmentHierarchyForChart() {
    return this.departmentsService.getDepartmentHierarchyForChart();
  }

  @Get('users/all')
  @ApiOperation({ summary: 'Get all departments with their users' })
  @ApiResponse({
    status: 200,
    description: 'Returns all departments with their users',
    type: [DepartmentResponseDto],
  })
  @HasPermission('departments:read')
  getAllDepartmentUsers() {
    return this.departmentsService.getAllDepartmentUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the department',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @HasPermission('departments:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully updated.',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @HasPermission('departments:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @HasPermission('departments:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Assign a user to a department' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully assigned to the department.',
  })
  @ApiResponse({ status: 404, description: 'Department or user not found' })
  @HasPermission('departments:update')
  assignUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUserDto: AssignUserDto,
  ) {
    return this.departmentsService.assignUser(id, assignUserDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Remove a user from their department' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully removed from the department.',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HasPermission('departments:update')
  removeUserFromDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.removeUserFromDepartment(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users in a department' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all users in the department',
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @HasPermission('departments:read')
  getUsersByDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getUsersByDepartment(id);
  }

  @Get(':id/users/hierarchy')
  @ApiOperation({ summary: 'Get all users in a department and its child departments' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all users in the department hierarchy',
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @HasPermission('departments:read')
  getUsersInDepartmentHierarchy(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getUsersInDepartmentHierarchy(id);
  }
}
