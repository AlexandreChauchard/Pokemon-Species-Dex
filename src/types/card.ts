export interface Card {
  id: string
  pokemon_id: number
  pokemon_name: string
  image_url: string
  set_name: string
  number: string
  variant: string
  language: string
  sort_order: number | null
  created_at: string
}

export interface NewCardInput {
  pokemon_id: number
  pokemon_name: string
  image_url: string
  set_name: string
  number: string
  variant: string
  language: string
}
