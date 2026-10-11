import { RecommendationsServiceInterface } from 'src/core/shared-kernel/ports/recommendations-service.interface';
import GetUserTasteUseCase from './get-user-taste.usecase';

const build = (tasteOf: jest.Mock) =>
  new GetUserTasteUseCase({
    tasteOf,
  } as unknown as RecommendationsServiceInterface);

describe('GetUserTasteUseCase', () => {
  it('returns the taste from the Recommendations service', async () => {
    const response = {
      taste: {
        moods: [{ key: 'mood:calm', value: 0.8 }],
        topics: [{ key: 'topics:love', value: 0.5 }],
      },
    };
    const tasteOf = jest.fn().mockResolvedValue(response);

    await expect(build(tasteOf).execute({ userId: 7 })).resolves.toEqual(
      response,
    );
    expect(tasteOf).toHaveBeenCalledWith(7);
  });

  it('returns null taste when the service fails', async () => {
    const useCase = build(jest.fn().mockRejectedValue(new Error('timeout')));
    jest.spyOn(useCase['logger'], 'warn').mockImplementation(() => undefined);

    await expect(useCase.execute({ userId: 7 })).resolves.toEqual({
      taste: null,
    });
  });
});
