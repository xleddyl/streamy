export type VideoInfo = {
   id: string
   title: string
   thumbnail: string
}

export const extractYouTubeId = (url: string): string | undefined => {
   const match = url
      .trim()
      .match(
         /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/
      )
   return match?.[1]
}

export const fallbackVideoInfo = (id: string): VideoInfo => ({
   id,
   title: 'YouTube video',
   thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
})

export const fetchVideoInfo = async (url: string): Promise<VideoInfo | undefined> => {
   const id = extractYouTubeId(url)
   if (!id) return undefined

   try {
      const result = await $fetch<{ title?: string; thumbnail_url?: string }>(
         'https://www.youtube.com/oembed',
         {
            params: { url: `https://www.youtube.com/watch?v=${id}`, format: 'json' },
            timeout: 5000,
         }
      )
      if (!result?.title) return undefined
      return {
         id,
         title: result.title,
         thumbnail: result.thumbnail_url ?? fallbackVideoInfo(id).thumbnail,
      }
   } catch (error) {
      // 4xx means the video does not exist (or is private); anything else is the
      // lookup being unreachable — the id is well-formed, let the user queue it anyway
      const status = (error as { status?: number }).status
      if (status && status >= 400 && status < 500) return undefined
      return fallbackVideoInfo(id)
   }
}
