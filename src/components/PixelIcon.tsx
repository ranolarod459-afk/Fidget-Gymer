import React from "react";
import Svg, { Rect } from "react-native-svg";
import { colors } from "../theme/colors";

interface IconProps {
  size?: number;
  color?: string;
}

export function DumbbellIcon({ size = 32, color = colors.primary }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges">
      <Rect x={1} y={6} width={1} height={4} fill={color} />
      <Rect x={2} y={5} width={1} height={6} fill={color} />
      <Rect x={3} y={7} width={10} height={2} fill={color} />
      <Rect x={13} y={5} width={1} height={6} fill={color} />
      <Rect x={14} y={6} width={1} height={4} fill={color} />
    </Svg>
  );
}

export function HourglassIcon({
  size = 16,
  color = colors.primary,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges">
      <Rect x={2} y={1} width={12} height={2} fill={color} />
      <Rect x={3} y={3} width={10} height={2} fill={color} />
      <Rect x={5} y={5} width={6} height={2} fill={color} />
      <Rect x={7} y={7} width={2} height={2} fill={color} />
      <Rect x={5} y={9} width={6} height={2} fill={color} />
      <Rect x={3} y={11} width={10} height={2} fill={color} />
      <Rect x={2} y={13} width={12} height={2} fill={color} />
    </Svg>
  );
}

export function SnakeIcon({
  size = 48,
  color = colors.primary,
  food = colors.amber,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges">
      <Rect x={2} y={10} width={3} height={3} fill={color} />
      <Rect x={5} y={10} width={3} height={3} fill={color} />
      <Rect x={8} y={10} width={3} height={3} fill={color} />
      <Rect x={8} y={7} width={3} height={3} fill={color} />
      <Rect x={11} y={7} width={3} height={3} fill={colors.primaryLight} />
      <Rect x={13} y={7} width={1} height={1} fill={colors.surfaceLowest} />
      <Rect x={12} y={2} width={2} height={2} fill={food} />
    </Svg>
  );
}

export function BirdIcon({ size = 48 }: IconProps) {
  const body = colors.amber;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges">
      <Rect x={4} y={6} width={6} height={5} fill={body} />
      <Rect x={5} y={4} width={5} height={2} fill={body} />
      <Rect x={2} y={7} width={3} height={3} fill={colors.amberLight} />
      <Rect x={5} y={9} width={4} height={2} fill={colors.amberLight} />
      <Rect x={8} y={4} width={2} height={2} fill={colors.text} />
      <Rect x={9} y={5} width={1} height={1} fill={colors.surfaceLowest} />
      <Rect x={10} y={7} width={3} height={2} fill={colors.danger} />
    </Svg>
  );
}

export function GalagaIcon({ size = 48, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      {/* Ship body */}
      <Rect x={7} y={3} width={2} height={2} fill={color} />
      <Rect x={6} y={5} width={4} height={2} fill={color} />
      <Rect x={5} y={7} width={6} height={2} fill={color} />
      <Rect x={3} y={9} width={10} height={2} fill={color} />
      <Rect x={2} y={11} width={4} height={2} fill={color} />
      <Rect x={10} y={11} width={4} height={2} fill={color} />
      {/* Wings */}
      <Rect x={1} y={7} width={2} height={4} fill={colors.primaryLight} />
      <Rect x={13} y={7} width={2} height={4} fill={colors.primaryLight} />
      {/* Cockpit highlight */}
      <Rect x={7} y={6} width={2} height={1} fill={colors.surfaceLowest} />
    </Svg>
  );
}