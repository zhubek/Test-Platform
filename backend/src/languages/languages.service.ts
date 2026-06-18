import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.language.findMany();
  }

  create(dto: CreateLanguageDto) {
    return this.prisma.language.create({ data: { name: dto.name, label: dto.label } });
  }

  update(id: string, dto: UpdateLanguageDto) {
    return this.prisma.language.update({ where: { id }, data: { ...dto } });
  }

  remove(id: string) {
    return this.prisma.language.delete({ where: { id } });
  }

  async listForProject(projectId: string) {
    const links = await this.prisma.projectLanguage.findMany({
      where: { projectId },
      include: { language: true },
    });
    return links.map((l) => l.language);
  }

  assignToProject(projectId: string, languageId: string) {
    return this.prisma.projectLanguage.create({
      data: { project: { connect: { id: projectId } }, language: { connect: { id: languageId } } },
    });
  }

  removeFromProject(projectId: string, languageId: string) {
    return this.prisma.projectLanguage.delete({
      where: { projectId_languageId: { projectId, languageId } },
    });
  }
}
