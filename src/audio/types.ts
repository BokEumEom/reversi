export type SoundType = 'place' | 'flip' | 'invalid' | 'win' | 'lose'

export interface AudioSettings {
  readonly enabled: boolean
  readonly volume: number
}
