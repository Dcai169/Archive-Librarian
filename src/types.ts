export interface Entry { name: string, link: string }
export interface destinyEntry extends Entry { aliases: string[], gender?: typeof GenderUnion, armorClass?: typeof DestinyClassUnion }
export interface haloEntry extends Entry { game: string }
export interface warframeEntry extends Entry { sfm1: string, sfm2: string, sfm3: string }

export let GenderUnion: 'male' | 'female'
export let DestinyClassUnion: 'titan' | 'hunter' | 'warlock'