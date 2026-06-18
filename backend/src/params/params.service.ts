import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { CreateParamDto } from './dto/create-param.dto';
import { UpdateParamDto } from './dto/update-param.dto';

@Injectable()
export class ParamsService {
  constructor(private readonly prisma: PrismaService) {}

  listForProject(projectId: string) {
    return this.prisma.projectParam.findMany({
      where: { projectId },
      include: { options: true },
    });
  }

  createUnderProject(projectId: string, dto: CreateParamDto) {
    return this.prisma.projectParam.create({
      data: { name: dto.name, type: dto.type ?? 'STRING', project: { connect: { id: projectId } } },
    });
  }

  update(id: string, dto: UpdateParamDto) {
    return this.prisma.projectParam.update({ where: { id }, data: { ...dto } });
  }

  remove(id: string) {
    return this.prisma.projectParam.delete({ where: { id } });
  }

  listOptions(paramId: string) {
    return this.prisma.projectParamOption.findMany({ where: { projectParamId: paramId } });
  }

  addOption(paramId: string, dto: CreateOptionDto) {
    return this.prisma.projectParamOption.create({
      data: { valueText: dto.valueText, param: { connect: { id: paramId } } },
    });
  }

  removeOption(paramId: string, optionId: string) {
    return this.prisma.projectParamOption.deleteMany({
      where: { id: optionId, projectParamId: paramId },
    });
  }
}
