import React from 'react';
import {
  Svg,
  Path,
  Circle,
  Text as SvgText,
  View,
  Text,
} from '@react-pdf/renderer';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  innerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

export function DonutChart({
  data,
  size = 150,
  innerRadius = 40,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 2;
  const strokeWidth = outerRadius - innerRadius;
  const midRadius = innerRadius + strokeWidth / 2;

  let currentAngle = 0;

  const arcs = data
    .filter(d => d.value > 0)
    .map(d => {
      const sliceAngle = (d.value / total) * 360;
      const effectiveAngle = Math.min(sliceAngle, 359.99);
      const startAngle = currentAngle;
      const endAngle = currentAngle + effectiveAngle;
      currentAngle += sliceAngle;

      return {
        ...d,
        path: describeArc(cx, cy, midRadius, startAngle, endAngle),
      };
    });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc, i) => (
          <Path
            key={i}
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
          />
        ))}
        {innerRadius > 0 && (
          <Circle cx={cx} cy={cy} r={innerRadius} fill="white" />
        )}
        {centerLabel && (
          <SvgText
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            style={{ fontSize: 7, fontFamily: 'Helvetica', fill: '#6B7280' }}
          >
            {centerLabel}
          </SvgText>
        )}
        {centerValue && (
          <SvgText
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              fill: '#111827',
            }}
          >
            {centerValue}
          </SvgText>
        )}
      </Svg>

      {showLegend && (
        <View style={{ flex: 1 }}>
          {data
            .filter(d => d.value > 0)
            .map((d, i) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: d.color,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 7,
                      fontFamily: 'Helvetica',
                      color: '#374151',
                    }}
                  >
                    {d.label} ({pct}%)
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}
