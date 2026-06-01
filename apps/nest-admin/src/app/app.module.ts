import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RoleModule } from 'src/modules/role/role.module';
import { PermissionModule } from 'src/modules/permission/permission.module';

@Module({
    imports: [
        CommonModule,
        UserModule,
        AuthModule,
        RoleModule,
        PermissionModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
