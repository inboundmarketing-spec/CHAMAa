import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { hasFullAccess } from '@chama/shared';

@Injectable()
export class FullAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || !hasFullAccess(user.role)) {
      throw new ForbiddenException('Acesso restrito');
    }
    return true;
  }
}
