export type Movie = {
  id: string
  title: string | null
  year: string | null
  overview: string | null
  poster: string | null
  rating: number | null
  genres: string[]
  runtime: string | null
  director: string | null
  actors: string | null
}

export type User = {
  id: number
  email: string
  username: string
  created_at: string
}

export type Review = {
  username: string
  rating: number
  text: string | null
  date: string
}

export type UserReview = {
  imdb_id: string
  rating: number
  text: string | null
  date: string
  updated_at: string
  movie: Movie
}

export type MovieReviews = {
  reviews: Review[]
  average_rating: number | null
  count: number
}

export type WatchlistMovie = Movie & {
  added_at?: string
}

export type AccessToken = {
  access_token: string
  token_type: string
}
