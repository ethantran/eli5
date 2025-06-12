import { notFound } from '@tanstack/react-router'
import axios from 'redaxios'

export type PostType = {
  id: string
  title: string
  body: string
}

export const fetchPost = async (postId: string): Promise<PostType> => {
  console.info(`Fetching post with id ${postId}...`)
  try {
    const post = await axios
      .get<PostType>(`https://jsonplaceholder.typicode.com/posts/${postId}`)
      .then((r) => r.data)
    return post
  } catch (err: any) {
    console.error(err)
    if (err.status === 404) {
      throw notFound()
    }
    throw err
  }
}

export const fetchPosts = async (): Promise<Array<PostType>> => {
  console.info('Fetching posts...')
  await new Promise((r) => setTimeout(r, 1000))
  return axios
    .get<Array<PostType>>('https://jsonplaceholder.typicode.com/posts')
    .then((r) => r.data.slice(0, 10))
}
