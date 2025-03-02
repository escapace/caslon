import { describe, expect, test } from 'vitest'
import { calculateClamp, calculateClamps, calculateSpaceScale, calculateTypeScale } from './index'

// utils
// const logObject = (a: unknown) => console.dir(a, { depth: 4 })

describe('calculateClamp', () => {
  test('should generate a single clamp function', () => {
    const result = calculateClamp({ maxSize: 32, maxWidth: 1240, minSize: 16, minWidth: 320 })
    const expected = 'clamp(1rem, 0.6522rem + 1.7391vw, 2rem)'
    expect(result).toEqual(expected)
  })

  test('should generate a px clamp function', () => {
    const result = calculateClamp({
      maxSize: 32,
      maxWidth: 1240,
      minSize: 16,
      minWidth: 320,
      usePx: true,
    })
    const expected = 'clamp(16px, 10.4348px + 1.7391vw, 32px)'
    expect(result).toEqual(expected)
  })

  test('should generate a cqi clamp function', () => {
    const result = calculateClamp({
      maxSize: 32,
      maxWidth: 1240,
      minSize: 16,
      minWidth: 320,
      relativeTo: 'container',
    })
    const expected = 'clamp(1rem, 0.6522rem + 1.7391cqi, 2rem)'
    expect(result).toEqual(expected)
  })

  test('should generate a vi clamp function', () => {
    const result = calculateClamp({
      maxSize: 32,
      maxWidth: 1240,
      minSize: 16,
      minWidth: 320,
      relativeTo: 'viewport',
    })
    const expected = 'clamp(1rem, 0.6522rem + 1.7391vi, 2rem)'
    expect(result).toEqual(expected)
  })
})

describe('calculateClamps', () => {
  test('should generate multiple clamps', () => {
    const result = calculateClamps({
      maxWidth: 1080,
      minWidth: 320,
      pairs: [
        [12, 16],
        [40, 28],
      ],
    })
    const expected = [
      {
        clamp: 'clamp(0.75rem, 0.6447rem + 0.5263vw, 1rem)',
        clampPx: 'clamp(12px, 10.3158px + 0.5263vw, 16px)',
        label: '12-16',
      },
      {
        clamp: 'clamp(1.75rem, 2.8158rem + -1.5789vw, 2.5rem)',
        clampPx: 'clamp(28px, 45.0526px + -1.5789vw, 40px)',
        label: '40-28',
      },
    ]
    expect(result).toStrictEqual(expected)
  })
})

describe('calculateSpaceScale', () => {
  test('should generate a valid <D-b>scale', () => {
    const result = calculateSpaceScale({
      customSizes: ['s-l', '2xl-4xl'],
      maxSize: 20,
      maxWidth: 1240,
      minSize: 18,
      minWidth: 320,
      negativeSteps: [0.75, 0.5, 0.25],
      positiveSteps: [1.5, 2, 3, 4, 6],
    })
    const expected = {
      customPairs: [
        {
          clamp: 'clamp(1.125rem, 0.6467rem + 2.3913vw, 2.5rem)',
          clampPx: 'clamp(18px, 10.3478px + 2.3913vw, 40px)',
          label: 's-l',
          maxSize: 40,
          minSize: 18,
        },
      ],
      oneUpPairs: [
        {
          clamp: 'clamp(0.3125rem, 0.2038rem + 0.5435vw, 0.625rem)',
          clampPx: 'clamp(5px, 3.2609px + 0.5435vw, 10px)',
          label: '3xs-2xs',
          maxSize: 10,
          minSize: 5,
        },
        {
          clamp: 'clamp(0.5625rem, 0.4321rem + 0.6522vw, 0.9375rem)',
          clampPx: 'clamp(9px, 6.913px + 0.6522vw, 15px)',
          label: '2xs-xs',
          maxSize: 15,
          minSize: 9,
        },
        {
          clamp: 'clamp(0.875rem, 0.7446rem + 0.6522vw, 1.25rem)',
          clampPx: 'clamp(14px, 11.913px + 0.6522vw, 20px)',
          label: 'xs-s',
          maxSize: 20,
          minSize: 14,
        },
        {
          clamp: 'clamp(1.125rem, 0.8641rem + 1.3043vw, 1.875rem)',
          clampPx: 'clamp(18px, 13.8261px + 1.3043vw, 30px)',
          label: 's-m',
          maxSize: 30,
          minSize: 18,
        },
        {
          clamp: 'clamp(1.6875rem, 1.4049rem + 1.413vw, 2.5rem)',
          clampPx: 'clamp(27px, 22.4783px + 1.413vw, 40px)',
          label: 'm-l',
          maxSize: 40,
          minSize: 27,
        },
        {
          clamp: 'clamp(2.25rem, 1.7283rem + 2.6087vw, 3.75rem)',
          clampPx: 'clamp(36px, 27.6522px + 2.6087vw, 60px)',
          label: 'l-xl',
          maxSize: 60,
          minSize: 36,
        },
        {
          clamp: 'clamp(3.375rem, 2.8098rem + 2.8261vw, 5rem)',
          clampPx: 'clamp(54px, 44.9565px + 2.8261vw, 80px)',
          label: 'xl-2xl',
          maxSize: 80,
          minSize: 54,
        },
        {
          clamp: 'clamp(4.5rem, 3.4565rem + 5.2174vw, 7.5rem)',
          clampPx: 'clamp(72px, 55.3043px + 5.2174vw, 120px)',
          label: '2xl-3xl',
          maxSize: 120,
          minSize: 72,
        },
      ],
      sizes: [
        {
          clamp: 'clamp(0.3125rem, 0.3125rem + 0vw, 0.3125rem)',
          clampPx: 'clamp(5px, 5px + 0vw, 5px)',
          label: '3xs',
          maxSize: 5,
          minSize: 5,
          multiplier: 0.25,
        },
        {
          clamp: 'clamp(0.5625rem, 0.5408rem + 0.1087vw, 0.625rem)',
          clampPx: 'clamp(9px, 8.6522px + 0.1087vw, 10px)',
          label: '2xs',
          maxSize: 10,
          minSize: 9,
          multiplier: 0.5,
        },
        {
          clamp: 'clamp(0.875rem, 0.8533rem + 0.1087vw, 0.9375rem)',
          clampPx: 'clamp(14px, 13.6522px + 0.1087vw, 15px)',
          label: 'xs',
          maxSize: 15,
          minSize: 14,
          multiplier: 0.75,
        },
        {
          clamp: 'clamp(1.125rem, 1.0815rem + 0.2174vw, 1.25rem)',
          clampPx: 'clamp(18px, 17.3043px + 0.2174vw, 20px)',
          label: 's',
          maxSize: 20,
          minSize: 18,
          multiplier: 1,
        },
        {
          clamp: 'clamp(1.6875rem, 1.6223rem + 0.3261vw, 1.875rem)',
          clampPx: 'clamp(27px, 25.9565px + 0.3261vw, 30px)',
          label: 'm',
          maxSize: 30,
          minSize: 27,
          multiplier: 1.5,
        },
        {
          clamp: 'clamp(2.25rem, 2.163rem + 0.4348vw, 2.5rem)',
          clampPx: 'clamp(36px, 34.6087px + 0.4348vw, 40px)',
          label: 'l',
          maxSize: 40,
          minSize: 36,
          multiplier: 2,
        },
        {
          clamp: 'clamp(3.375rem, 3.2446rem + 0.6522vw, 3.75rem)',
          clampPx: 'clamp(54px, 51.913px + 0.6522vw, 60px)',
          label: 'xl',
          maxSize: 60,
          minSize: 54,
          multiplier: 3,
        },
        {
          clamp: 'clamp(4.5rem, 4.3261rem + 0.8696vw, 5rem)',
          clampPx: 'clamp(72px, 69.2174px + 0.8696vw, 80px)',
          label: '2xl',
          maxSize: 80,
          minSize: 72,
          multiplier: 4,
        },
        {
          clamp: 'clamp(6.75rem, 6.4891rem + 1.3043vw, 7.5rem)',
          clampPx: 'clamp(108px, 103.8261px + 1.3043vw, 120px)',
          label: '3xl',
          maxSize: 120,
          minSize: 108,
          multiplier: 6,
        },
      ],
    }
    expect(result).toStrictEqual(expected)
  })

  test('should generate a valid scale', () => {
    const result = calculateSpaceScale({
      customSizes: ['s-l', '2xl-4xl'],
      maxSize: 20,
      maxWidth: 1240,
      minSize: 18,
      minWidth: 320,
      negativeSteps: [0.75, 0.5, 0.25],
      positiveSteps: [1.5, 2, 3, 4, 6, 8, 10],
    })
    const expected = {
      customPairs: [
        {
          clamp: 'clamp(1.125rem, 0.6467rem + 2.3913vw, 2.5rem)',
          clampPx: 'clamp(18px, 10.3478px + 2.3913vw, 40px)',
          label: 's-l',
          maxSize: 40,
          minSize: 18,
        },
        {
          clamp: 'clamp(4.5rem, 2.587rem + 9.5652vw, 10rem)',
          clampPx: 'clamp(72px, 41.3913px + 9.5652vw, 160px)',
          label: '2xl-4xl',
          maxSize: 160,
          minSize: 72,
        },
      ],
      oneUpPairs: [
        {
          clamp: 'clamp(0.3125rem, 0.2038rem + 0.5435vw, 0.625rem)',
          clampPx: 'clamp(5px, 3.2609px + 0.5435vw, 10px)',
          label: '3xs-2xs',
          maxSize: 10,
          minSize: 5,
        },
        {
          clamp: 'clamp(0.5625rem, 0.4321rem + 0.6522vw, 0.9375rem)',
          clampPx: 'clamp(9px, 6.913px + 0.6522vw, 15px)',
          label: '2xs-xs',
          maxSize: 15,
          minSize: 9,
        },
        {
          clamp: 'clamp(0.875rem, 0.7446rem + 0.6522vw, 1.25rem)',
          clampPx: 'clamp(14px, 11.913px + 0.6522vw, 20px)',
          label: 'xs-s',
          maxSize: 20,
          minSize: 14,
        },
        {
          clamp: 'clamp(1.125rem, 0.8641rem + 1.3043vw, 1.875rem)',
          clampPx: 'clamp(18px, 13.8261px + 1.3043vw, 30px)',
          label: 's-m',
          maxSize: 30,
          minSize: 18,
        },
        {
          clamp: 'clamp(1.6875rem, 1.4049rem + 1.413vw, 2.5rem)',
          clampPx: 'clamp(27px, 22.4783px + 1.413vw, 40px)',
          label: 'm-l',
          maxSize: 40,
          minSize: 27,
        },
        {
          clamp: 'clamp(2.25rem, 1.7283rem + 2.6087vw, 3.75rem)',
          clampPx: 'clamp(36px, 27.6522px + 2.6087vw, 60px)',
          label: 'l-xl',
          maxSize: 60,
          minSize: 36,
        },
        {
          clamp: 'clamp(3.375rem, 2.8098rem + 2.8261vw, 5rem)',
          clampPx: 'clamp(54px, 44.9565px + 2.8261vw, 80px)',
          label: 'xl-2xl',
          maxSize: 80,
          minSize: 54,
        },
        {
          clamp: 'clamp(4.5rem, 3.4565rem + 5.2174vw, 7.5rem)',
          clampPx: 'clamp(72px, 55.3043px + 5.2174vw, 120px)',
          label: '2xl-3xl',
          maxSize: 120,
          minSize: 72,
        },
        {
          clamp: 'clamp(6.75rem, 5.6196rem + 5.6522vw, 10rem)',
          clampPx: 'clamp(108px, 89.913px + 5.6522vw, 160px)',
          label: '3xl-4xl',
          maxSize: 160,
          minSize: 108,
        },
        {
          clamp: 'clamp(9rem, 7.7826rem + 6.087vw, 12.5rem)',
          clampPx: 'clamp(144px, 124.5217px + 6.087vw, 200px)',
          label: '4xl-5xl',
          maxSize: 200,
          minSize: 144,
        },
      ],
      sizes: [
        {
          clamp: 'clamp(0.3125rem, 0.3125rem + 0vw, 0.3125rem)',
          clampPx: 'clamp(5px, 5px + 0vw, 5px)',
          label: '3xs',
          maxSize: 5,
          minSize: 5,
          multiplier: 0.25,
        },
        {
          clamp: 'clamp(0.5625rem, 0.5408rem + 0.1087vw, 0.625rem)',
          clampPx: 'clamp(9px, 8.6522px + 0.1087vw, 10px)',
          label: '2xs',
          maxSize: 10,
          minSize: 9,
          multiplier: 0.5,
        },
        {
          clamp: 'clamp(0.875rem, 0.8533rem + 0.1087vw, 0.9375rem)',
          clampPx: 'clamp(14px, 13.6522px + 0.1087vw, 15px)',
          label: 'xs',
          maxSize: 15,
          minSize: 14,
          multiplier: 0.75,
        },
        {
          clamp: 'clamp(1.125rem, 1.0815rem + 0.2174vw, 1.25rem)',
          clampPx: 'clamp(18px, 17.3043px + 0.2174vw, 20px)',
          label: 's',
          maxSize: 20,
          minSize: 18,
          multiplier: 1,
        },
        {
          clamp: 'clamp(1.6875rem, 1.6223rem + 0.3261vw, 1.875rem)',
          clampPx: 'clamp(27px, 25.9565px + 0.3261vw, 30px)',
          label: 'm',
          maxSize: 30,
          minSize: 27,
          multiplier: 1.5,
        },
        {
          clamp: 'clamp(2.25rem, 2.163rem + 0.4348vw, 2.5rem)',
          clampPx: 'clamp(36px, 34.6087px + 0.4348vw, 40px)',
          label: 'l',
          maxSize: 40,
          minSize: 36,
          multiplier: 2,
        },
        {
          clamp: 'clamp(3.375rem, 3.2446rem + 0.6522vw, 3.75rem)',
          clampPx: 'clamp(54px, 51.913px + 0.6522vw, 60px)',
          label: 'xl',
          maxSize: 60,
          minSize: 54,
          multiplier: 3,
        },
        {
          clamp: 'clamp(4.5rem, 4.3261rem + 0.8696vw, 5rem)',
          clampPx: 'clamp(72px, 69.2174px + 0.8696vw, 80px)',
          label: '2xl',
          maxSize: 80,
          minSize: 72,
          multiplier: 4,
        },
        {
          clamp: 'clamp(6.75rem, 6.4891rem + 1.3043vw, 7.5rem)',
          clampPx: 'clamp(108px, 103.8261px + 1.3043vw, 120px)',
          label: '3xl',
          maxSize: 120,
          minSize: 108,
          multiplier: 6,
        },
        {
          clamp: 'clamp(9rem, 8.6522rem + 1.7391vw, 10rem)',
          clampPx: 'clamp(144px, 138.4348px + 1.7391vw, 160px)',
          label: '4xl',
          maxSize: 160,
          minSize: 144,
          multiplier: 8,
        },
        {
          clamp: 'clamp(11.25rem, 10.8152rem + 2.1739vw, 12.5rem)',
          clampPx: 'clamp(180px, 173.0435px + 2.1739vw, 200px)',
          label: '5xl',
          maxSize: 200,
          minSize: 180,
          multiplier: 10,
        },
      ],
    }
    expect(result).toStrictEqual(expected)
  })
})

describe('calculateTypeScale', () => {
  test('should generate a valid scale', () => {
    const result = calculateTypeScale({
      maxFontSize: 20,
      maxTypeScale: 1.25,
      maxWidth: 1240,
      minFontSize: 18,
      minTypeScale: 1.2,
      minWidth: 320,
      negativeSteps: 2,
      positiveSteps: 5,
    })
    expect(result).toMatchSnapshot()
  })

  test('should generate a scale with tailwind labels', () => {
    const result = calculateTypeScale({
      labelStyle: 'tailwind',
      maxFontSize: 20,
      maxTypeScale: 1.25,
      maxWidth: 1240,
      minFontSize: 18,
      minTypeScale: 1.2,
      minWidth: 320,
      negativeSteps: 3,
      positiveSteps: 5,
    })

    expect(result).toMatchSnapshot()
  })

  test('should generate a scale with tshirt labels', () => {
    const result = calculateTypeScale({
      labelStyle: 'tshirt',
      maxFontSize: 20,
      maxTypeScale: 1.25,
      maxWidth: 1240,
      minFontSize: 18,
      minTypeScale: 1.2,
      minWidth: 320,
      negativeSteps: 3,
      positiveSteps: 5,
    })

    expect(result).toMatchSnapshot()
  })
})
