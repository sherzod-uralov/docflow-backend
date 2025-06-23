import { ApiProperty } from '@nestjs/swagger';

export class DepartmentChartNodeDto {
  @ApiProperty({ example: 1, description: 'Department ID' })
  id: number;

  @ApiProperty({ example: 'Finance Department', description: 'Department name' })
  name: string;

  @ApiProperty({
    example: 'Handles all financial operations',
    description: 'Department description',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: 5, description: 'Number of users in this department' })
  userCount: number;

  @ApiProperty({ example: 0, description: 'Hierarchy level (0 for root departments)' })
  level: number;

  @ApiProperty({
    example: 2,
    description: 'Parent department ID',
    required: false,
    nullable: true,
  })
  parentId?: number | null;

  @ApiProperty({
    type: [DepartmentChartNodeDto],
    description: 'Child departments',
    isArray: true,
  })
  children: DepartmentChartNodeDto[];
}

export class DepartmentHierarchyChartDto {
  @ApiProperty({
    type: [DepartmentChartNodeDto],
    description: 'Hierarchical chart data of departments',
    isArray: true,
  })
  chartData: DepartmentChartNodeDto[];

  @ApiProperty({ example: 10, description: 'Total number of departments' })
  totalDepartments: number;

  @ApiProperty({ example: 3, description: 'Maximum depth of the hierarchy' })
  maxDepth: number;

  @ApiProperty({ example: 50, description: 'Total number of users across all departments' })
  totalUsers: number;
}