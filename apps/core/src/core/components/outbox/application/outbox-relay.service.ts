import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import {
  EventPublisherInterface,
  EventPublisherInterfaceType,
} from 'src/core/shared-kernel/ports/event-publisher.interface';
import { OutboxConfig } from 'src/core/configuration/config.type';
import { OutboxStore, OutboxStoreType } from '../ports/outbox-store.port';

export interface RelayCycleResult {
  published: number;
  failed: number;
}

const RELAY_INTERVAL_NAME = 'outbox-relay';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Publishes unpublished outbox events to RabbitMQ.
 *
 * Every cycle runs in one transaction: lock a batch (FOR UPDATE SKIP LOCKED,
 * oldest first), publish events one by one waiting for the broker confirm,
 * mark each as published. On the first failure the event gets attempts + 1
 * and last_error, and the rest of the batch waits for the next cycle so the
 * order is kept and a dead broker costs one timeout per cycle, not a hundred.
 * Delivery is at-least-once: consumers deduplicate by event_id.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelay.name);
  private readonly config: OutboxConfig;
  private running = false;

  constructor(
    @Inject(OutboxStoreType)
    private readonly store: OutboxStore,
    @Inject(EventPublisherInterfaceType)
    private readonly publisher: EventPublisherInterface,
    private readonly schedulerRegistry: SchedulerRegistry,
    configService: ConfigService,
  ) {
    this.config = configService.get<OutboxConfig>('outbox');
  }

  onApplicationBootstrap(): void {
    const interval = setInterval(
      () => void this.runCycle(),
      this.config.relayIntervalMs,
    );
    this.schedulerRegistry.addInterval(RELAY_INTERVAL_NAME, interval);
  }

  onApplicationShutdown(): void {
    if (this.schedulerRegistry.doesExist('interval', RELAY_INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(RELAY_INTERVAL_NAME);
    }
  }

  /** One relay cycle; null when the previous cycle is still running. */
  async runCycle(): Promise<RelayCycleResult | null> {
    if (this.running) {
      return null;
    }
    this.running = true;

    try {
      return await this.store.transaction(async (transaction) => {
        const events = await this.store.lockUnpublishedBatch(
          this.config.batchSize,
          transaction,
        );
        const result: RelayCycleResult = { published: 0, failed: 0 };

        for (const event of events) {
          try {
            await this.publisher.publish(event.payload);
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await this.store.markFailed(event.id, error, transaction);
            result.failed += 1;
            this.logger.warn(
              `Publishing ${event.event_type} ${event.id} failed (attempt ${event.attempts + 1}): ${error}`,
            );
            break;
          }

          await this.store.markPublished(event.id, transaction);
          result.published += 1;
        }

        return result;
      });
    } catch (err) {
      // e.g. the database is unavailable: try again on the next cycle
      this.logger.error(`Outbox relay cycle failed: ${err.message}`, err.stack);
      return { published: 0, failed: 0 };
    } finally {
      this.running = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanup(): Promise<void> {
    const before = new Date(Date.now() - this.config.retentionDays * DAY_MS);
    const deleted = await this.store.deletePublishedBefore(before);
    this.logger.log(`Deleted ${deleted} published outbox events`);
  }
}
