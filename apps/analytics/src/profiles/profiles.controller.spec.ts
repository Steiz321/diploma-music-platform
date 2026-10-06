import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsRepository } from '../common/analytics.repository';
import { ProfilesController } from './profiles.controller';

const controller = (debugEndpoints: boolean, repository = {}) =>
  new ProfilesController(
    repository as AnalyticsRepository,
    { get: () => debugEndpoints } as unknown as ConfigService,
  );

describe('ProfilesController', () => {
  it('does not exist unless debug endpoints are enabled', async () => {
    const profileView = jest.fn();

    await expect(controller(false, { profileView }).get(5)).rejects.toThrow(
      NotFoundException,
    );
    expect(profileView).not.toHaveBeenCalled();
  });

  it('shows the profile when enabled', async () => {
    const profileView = jest.fn().mockResolvedValue({
      profile: null,
      scores: [],
      sessions: { sessions: 0 },
    });

    await expect(
      controller(true, { profileView }).get(5),
    ).resolves.toMatchObject({
      user_id: 5,
      preferences: [],
    });
  });
});
