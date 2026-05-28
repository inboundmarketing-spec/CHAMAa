import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { canManageBroadcasts } from '@chama/shared';

@Injectable()
export class BroadcastAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || !canManageBroadcasts(user.role)) {
      throw new ForbiddenException(
        'Acesso restrito à equipe de comunicação (admin, mesa Lieu, criativa)',
      );
    }
    return true;
  }
}
