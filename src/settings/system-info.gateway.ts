import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SettingsService } from './settings.service';
import { Interval } from '@nestjs/schedule';

@WebSocketGateway({
  namespace: 'system-info',
  cors: {
    origin: '*',
  },
})
export class SystemInfoGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SystemInfoGateway.name);
  private connectedClients = 0;

  constructor(private readonly settingsService: SettingsService) {}

  afterInit() {
    this.logger.log('System Info WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id}, total clients: ${this.connectedClients}`);
    
    // Send initial system info when a client connects
    this.sendSystemInfo();
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id}, total clients: ${this.connectedClients}`);
  }

  // Send system info updates every 5 seconds if there are connected clients
  @Interval(100)
  async sendSystemInfo() {
    if (this.connectedClients > 0) {
      try {
        const systemInfo = await this.settingsService.getSystemInfo();
        this.server.emit('systemInfo', systemInfo);
      } catch (error) {
        this.logger.error(`Error sending system info: ${error.message}`, error.stack);
      }
    }
  }
}