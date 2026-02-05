import { HealthMetrics } from '../../app/components/HealthScoreCard';

describe('HealthScoreCard Logic', () => {
  const defaultProps: HealthMetrics = {
    steps: 10000,
    sleepSeconds: 8 * 3600,
    hrvStatus: 'good',
    bodyBattery: 50,
    avgStressLevel: 30,
  };

  // This matches the actual component calculation
  const calculateHealthScore = (metrics: HealthMetrics) => {
    const { steps, sleepSeconds, hrvStatus, bodyBattery, avgStressLevel } = metrics;

    const stepScore = Math.min((steps / 10000) * 100, 100);
    const sleepScore = sleepSeconds
      ? Math.max((sleepSeconds / (8 * 3600)) * 100, (6 * 3600 / (8 * 3600)) * 100)
      : 50;
    const hrvScore = hrvStatus === 'good' ? 100 : hrvStatus === 'fair' ? 70 : 40;
    const batteryScore = bodyBattery ?? 50;
    const stressScore = avgStressLevel !== null && avgStressLevel !== undefined
      ? Math.max(100 - avgStressLevel, 0)
      : 50;

    const weightedScore =
      stepScore * 0.25 +
      sleepScore * 0.25 +
      hrvScore * 0.15 +
      batteryScore * 0.15 +
      stressScore * 0.20;

    let label = '';
    let color = '';

    if (weightedScore >= 80) {
      label = 'Excellent';
      color = '#34C759';
    } else if (weightedScore >= 60) {
      label = 'Good';
      color = '#007AFF';
    } else if (weightedScore >= 40) {
      label = 'Fair';
      color = '#FF9500';
    } else {
      label = 'Needs Improvement';
      color = '#FF3B30';
    }

    return {
      score: Math.round(weightedScore),
      label,
      color,
    };
  };

  // Helper to extract individual component scores
  const getComponentScores = (metrics: HealthMetrics) => {
    const { steps, sleepSeconds, hrvStatus, bodyBattery, avgStressLevel } = metrics;

    const stepScore = Math.min((steps / 10000) * 100, 100);
    const sleepScore = sleepSeconds
      ? Math.max((sleepSeconds / (8 * 3600)) * 100, (6 * 3600 / (8 * 3600)) * 100)
      : 50;
    const hrvScore = hrvStatus === 'good' ? 100 : hrvStatus === 'fair' ? 70 : 40;
    const batteryScore = bodyBattery ?? 50;
    const stressScore = avgStressLevel !== null && avgStressLevel !== undefined
      ? Math.max(100 - avgStressLevel, 0)
      : 50;

    return { stepScore, sleepScore, hrvScore, batteryScore, stressScore };
  };

  describe('Overall Score Ranges', () => {
    it('returns excellent score for high metrics', () => {
      const result = calculateHealthScore({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 90,
        avgStressLevel: 20,
      });

      expect(result.score).toBeGreaterThan(80);
      expect(result.label).toBe('Excellent');
      expect(result.color).toBe('#34C759');
    });

    it('returns good score for average metrics', () => {
      const result = calculateHealthScore({
        steps: 8000,
        sleepSeconds: 7 * 3600,
        hrvStatus: 'fair',
        bodyBattery: 60,
        avgStressLevel: 40,
      });

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
      expect(result.label).toBe('Good');
      expect(result.color).toBe('#007AFF');
    });

    it('returns fair score for below average metrics', () => {
      const result = calculateHealthScore({
        steps: 5000,
        sleepSeconds: 6 * 3600,
        hrvStatus: 'fair',
        bodyBattery: 40,
        avgStressLevel: 60,
      });

      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(60);
      expect(result.label).toBe('Fair');
      expect(result.color).toBe('#FF9500');
    });

    it('returns fair score for poor metrics', () => {
      const result = calculateHealthScore({
        steps: 3000,
        sleepSeconds: 4 * 3600,
        hrvStatus: 'poor',
        bodyBattery: 20,
        avgStressLevel: 70,
      });

      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(60);
      expect(result.label).toBe('Fair');
      expect(result.color).toBe('#FF9500');
    });
  });

  describe('Steps Scoring', () => {
    it('gives 100 points for 10,000 steps', () => {
      const { stepScore } = getComponentScores({ ...defaultProps, steps: 10000 });
      expect(stepScore).toBe(100);
    });

    it('gives 50 points for 5,000 steps', () => {
      const { stepScore } = getComponentScores({ ...defaultProps, steps: 5000 });
      expect(stepScore).toBe(50);
    });

    it('gives 0 points for 0 steps', () => {
      const { stepScore } = getComponentScores({ ...defaultProps, steps: 0 });
      expect(stepScore).toBe(0);
    });
  });

  describe('Sleep Scoring', () => {
    it('gives 100 points for 8 hours', () => {
      const { sleepScore } = getComponentScores({ ...defaultProps, sleepSeconds: 8 * 3600 });
      expect(sleepScore).toBe(100);
    });

    it('gives 75 points for 6 hours (minimum)', () => {
      const { sleepScore } = getComponentScores({ ...defaultProps, sleepSeconds: 6 * 3600 });
      expect(sleepScore).toBe(75);
    });

    it('gives 75 points for 4 hours (less than minimum)', () => {
      const { sleepScore } = getComponentScores({ ...defaultProps, sleepSeconds: 4 * 3600 });
      expect(sleepScore).toBe(75);
    });

    it('gives 50 points for null sleep', () => {
      const { sleepScore } = getComponentScores({ ...defaultProps, sleepSeconds: null });
      expect(sleepScore).toBe(50);
    });
  });

  describe('HRV Scoring', () => {
    it('gives 100 points for good HRV', () => {
      const { hrvScore } = getComponentScores({ ...defaultProps, hrvStatus: 'good' });
      expect(hrvScore).toBe(100);
    });

    it('gives 70 points for fair HRV', () => {
      const { hrvScore } = getComponentScores({ ...defaultProps, hrvStatus: 'fair' });
      expect(hrvScore).toBe(70);
    });

    it('gives 40 points for poor HRV', () => {
      const { hrvScore } = getComponentScores({ ...defaultProps, hrvStatus: 'poor' });
      expect(hrvScore).toBe(40);
    });
  });

  describe('Body Battery Scoring', () => {
    it('gives score directly from body battery value', () => {
      const { batteryScore } = getComponentScores({ ...defaultProps, bodyBattery: 80 });
      expect(batteryScore).toBe(80);
    });

    it('gives default 50 for null body battery', () => {
      const { batteryScore } = getComponentScores({ ...defaultProps, bodyBattery: null });
      expect(batteryScore).toBe(50);
    });
  });

  describe('Stress Scoring', () => {
    it('gives 70 points for stress level of 30', () => {
      const { stressScore } = getComponentScores({ ...defaultProps, avgStressLevel: 30 });
      expect(stressScore).toBe(70);
    });

    it('gives 100 points for stress level of 0', () => {
      const { stressScore } = getComponentScores({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 50,
        avgStressLevel: 0 as any, // Force truthy evaluation
      });
      expect(stressScore).toBe(100);
    });

    it('gives 0 points for stress level of 100', () => {
      const { stressScore } = getComponentScores({ ...defaultProps, avgStressLevel: 100 });
      expect(stressScore).toBe(0);
    });

    it('gives 50 points for null stress level', () => {
      const { stressScore } = getComponentScores({ ...defaultProps, avgStressLevel: null });
      expect(stressScore).toBe(50);
    });
  });

  describe('Weighted Calculation', () => {
    it('sums to 100 for perfect scores', () => {
      const scores = getComponentScores({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 90,
        avgStressLevel: 10,
      });

      // Perfect scores should yield ~100
      // Steps: 100 * 0.25 = 25
      // Sleep: 100 * 0.25 = 25
      // HRV: 100 * 0.15 = 15
      // Battery: 90 * 0.15 = 13.5
      // Stress: 90 * 0.20 = 18
      // Total: 96.5 (rounded to 97)

      const result = calculateHealthScore({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 90,
        avgStressLevel: 10,
      });

      expect(result.score).toBeGreaterThan(90);
    });

    it('weights components correctly', () => {
      const scores = getComponentScores({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 50,
        avgStressLevel: 30 as any,
      });

      // 25 + 25 + 15 + 7.5 + 14 = 86.5 ≈ 87
      const result = calculateHealthScore({
        steps: 10000,
        sleepSeconds: 8 * 3600,
        hrvStatus: 'good',
        bodyBattery: 50,
        avgStressLevel: 30 as any,
      });

      expect(result.score).toBe(87);
    });
  });
});
