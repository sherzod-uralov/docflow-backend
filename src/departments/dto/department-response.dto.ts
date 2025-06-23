import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;
}

export class DepartmentResponseDto {
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

  @ApiProperty({
    example: 2,
    description: 'Parent department ID',
    required: false,
    nullable: true,
  })
  parentId?: number | null;

  @ApiProperty({
    type: () => DepartmentResponseDto,
    description: 'Parent department',
    required: false,
    nullable: true,
  })
  parent?: DepartmentResponseDto | null;

  @ApiProperty({
    type: [DepartmentResponseDto],
    description: 'Child departments',
    required: false,
  })
  children?: DepartmentResponseDto[];

  @ApiProperty({
    type: [UserDto],
    description: 'Users assigned to this department',
  })
  users: UserDto[];

  @ApiProperty({ example: '2023-06-21T10:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2023-06-21T10:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}
