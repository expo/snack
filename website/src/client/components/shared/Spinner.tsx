import { css, StyleSheet } from 'aphrodite';
import * as React from 'react';

import usePreferences from '../Preferences/usePreferences';

type Props = {
  color?: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
  segments?: number;
  segmentWidth?: number;
  segmentLength?: number;
  spacing?: number;
  fadeTo?: number;
  fadeSteps?: number;
};

export default function Spinner({
  color,
  segments = 12,
  segmentWidth = 2,
  segmentLength = 6,
  spacing = 4,
  fadeTo = 31 / 98,
  fadeSteps = 6,
}: Props) {
  const [prefs] = usePreferences();

  const { red, green, blue, alpha } =
    color !== undefined
      ? color
      : prefs.theme === 'dark'
      ? { red: 255, green: 255, blue: 255, alpha: 0.5 }
      : { red: 70, green: 48, blue: 235, alpha: 1 };

  const innerRadius = segmentWidth * 2 + spacing;
  const opacityDelta = (1 - fadeTo) / fadeSteps;

  const lines = [];

  for (let ii = 0; ii < segments; ii++) {
    const opacity = 1 - Math.min(ii, fadeSteps) * opacityDelta;
    const rotation = (-ii * 360) / segments;

    lines.push(
      <line
        key={ii}
        x1="0"
        y1={innerRadius}
        x2="0"
        y2={innerRadius + segmentLength}
        style={{ opacity }}
        transform={`rotate(${rotation})`}
      />
    );
  }

  const rgbaColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  const radius = innerRadius + segmentLength + Math.ceil(segmentWidth / 2);

  return (
    <svg className={css(styles.indicator)} width={radius * 2} height={radius * 2}>
      <g
        stroke={rgbaColor}
        strokeWidth={segmentWidth}
        strokeLinecap="round"
        transform={`translate(${radius}, ${radius})`}
      >
        {lines}
      </g>
    </svg>
  );
}

const spinKeyframes = {
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
};

const styles = StyleSheet.create({
  indicator: {
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationName: spinKeyframes,
    animationTimingFunction: 'steps(12)',
  },
});
