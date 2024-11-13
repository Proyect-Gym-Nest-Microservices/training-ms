import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Controller()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @MessagePattern('createEquipment')
  create(@Payload() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @MessagePattern('findAllEquipment')
  findAll() {
    return this.equipmentService.findAll();
  }

  @MessagePattern('findOneEquipment')
  findOne(@Payload() id: number) {
    return this.equipmentService.findOne(id);
  }

  @MessagePattern('updateEquipment')
  update(@Payload() updateEquipmentDto: UpdateEquipmentDto) {
    return this.equipmentService.update(updateEquipmentDto.id, updateEquipmentDto);
  }

  @MessagePattern('removeEquipment')
  remove(@Payload() id: number) {
    return this.equipmentService.remove(id);
  }
}
