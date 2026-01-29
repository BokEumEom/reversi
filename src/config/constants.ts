import type { Direction } from '../types'

export const BOARD_SIZE = 8

export const DIRECTIONS: ReadonlyArray<Direction> = [
  { dRow: -1, dCol: -1 }, // NW
  { dRow: -1, dCol: 0 },  // N
  { dRow: -1, dCol: 1 },  // NE
  { dRow: 0, dCol: -1 },  // W
  { dRow: 0, dCol: 1 },   // E
  { dRow: 1, dCol: -1 },  // SW
  { dRow: 1, dCol: 0 },   // S
  { dRow: 1, dCol: 1 },   // SE
]

export const AI_THINKING_DELAY = 500

export const POSITION_WEIGHTS: ReadonlyArray<ReadonlyArray<number>> = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
]
