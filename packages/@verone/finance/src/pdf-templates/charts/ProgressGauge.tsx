import React from 'react';
import { Svg, Rect, Text as SvgText, View, Text } from '@react-pdf/renderer';

interface ProgressGaugeProps {
  value: number; // 0-100
  label: string;
  thresholds?: { warning: number; danger: number };
}

function getGaugeColor(
  value: number,
  thresholds: { warning: number; danger: number }
): string {
  if (value >= thresholds.danger) return '#DC2626'; // red
  if (value >= thresholds.warning) return '#EA580C'; // orange
  return '#16A34A'; // green
}

export function ProgressGauge({
  value,
  label,
  thresholds = { warning: 20, danger: 40 },
}: ProgressGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color = getGaugeColor(clampedValue, thresholds);

  const width = 340;
  const barHeight = 16;
  const totalHeight = 40;
  const barY = 20;
  const fillWidth = (clampedValue / 100) * width;

  return (
    <View>
      <Text
        style={{
          fontSize: 8,
          fontFamily: 'Helvetica',
          color: '#374151',
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Svg
        width={width + 50}
        height={totalHeight}
        viewBox={`0 0 ${width + 50} ${totalHeight}`}
      >
        {/* Background bar */}
        <Rect
          x={0}
          y={barY}
          width={width}
          height={barHeight}
          fill="#E5E7EB"
          rx={4}
        />

        {/* Filled bar */}
        {clampedValue > 0 && (
          <Rect
            x={0}
            y={barY}
            width={Math.max(fillWidth, 4)}
            height={barHeight}
            fill={color}
            rx={4}
          />
        )}

        {/* Percentage text */}
        <SvgText
          x={width + 8}
          y={barY + barHeight / 2 + 4}
          style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', fill: color }}
        >
          {clampedValue.toFixed(1)}%
        </SvgText>
      </Svg>
    </View>
  );
}
