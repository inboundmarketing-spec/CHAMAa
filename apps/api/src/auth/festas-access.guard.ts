import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { canManageFestas } from '@chama/shared';

@Injectable()
export class FestasAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || !canManageFestas(user.role)) {
      throw new ForbiddenException(
        'Acesso restrito à equipe de comunicação (admin, mesa Lieu, criativa)',
      );
    }
    return true;
  }
}
