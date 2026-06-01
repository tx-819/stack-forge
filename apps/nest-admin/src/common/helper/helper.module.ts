import { Module } from '@nestjs/common';
import { HelperPaginationService } from './services/helper.pagination.service';

@Module({
    providers: [HelperPaginationService],
    exports: [HelperPaginationService],
})
export class HelperModule {}
