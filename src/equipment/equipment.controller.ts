import { Controller, ParseIntPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { PaginationDto } from 'src/common';
import { RateDto } from 'src/common/dto/rate.dto';


@Controller()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) { }

  @MessagePattern('create.equipment')
  createEquipment(@Payload() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.createEquipment(createEquipmentDto);
  }

  @MessagePattern('find.all.equipment')
  findAllEquipment(@Payload() paginationDto: PaginationDto) {
    return this.equipmentService.findAllEquipment(paginationDto);
  }

  @MessagePattern('find.one.equipment')
  findEquipmentById(@Payload('id', ParseIntPipe) id: number) {
    return this.equipmentService.findEquipmentById(id);
  }

  @MessagePattern('rate.equipment')
  rateWorkout(@Payload() rateDto: RateDto ) {
    return this.equipmentService.rateEquipment(rateDto);
  }

  @MessagePattern('update.equipment')
  updateEquipment(
    @Payload() payload: { id: number; updateEquipmentDto: UpdateEquipmentDto },
  ) {
    return this.equipmentService.updateEquipment(
      payload.id,
      payload.updateEquipmentDto,
    );
  }

  @MessagePattern('remove.equipment')
  removeEquipment(@Payload('id', ParseIntPipe) id: number) {
    return this.equipmentService.removeEquipment(id);
  }
}