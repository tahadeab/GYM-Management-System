const Helpers = require('../../scripts/helpers');

describe('Bilingual workflow state model', () => {
    test.each(['loading', 'empty', 'success', 'error'])('returns a bilingual %s state with retry affordance', type => {
        const state = Helpers.getBilingualState(type);
        expect(state.type).toBe(type);
        expect(state.title).toMatch(/[\/]/);
        expect(state.message).toBeTruthy();
        expect(state.retryLabel).toMatch(/Retry/);
    });

    test('allows workflow-specific empty and error messages', () => {
        expect(Helpers.getBilingualState('empty', 'No active rooms').message).toBe('No active rooms');
        expect(Helpers.getBilingualState('error', 'Room service failed').message).toBe('Room service failed');
    });
});
